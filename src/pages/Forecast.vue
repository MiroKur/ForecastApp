<template>
    <v-container class="py-8">
        <v-row justify="center">
            <v-col cols="12" md="8">
                <v-card>
                    <v-card-title class="justify-center">Paikkakunta & Sää</v-card-title>
                    <v-card-text>
                        <v-row>
                            <v-col cols="12" md="8">
                                <v-autocomplete
                                    v-model="selected"
                                    :items="searchResults"
                                    item-title="display_name"
                                    item-text="display_name"
                                    label="Haku paikkakunnasta"
                                    placeholder="Kirjoita kaupunki (esim. Tampere)"
                                    hide-details
                                    clearable
                                    @update:modelValue="onSelect"
                                    :loading="searching"
                                />
                            </v-col>

                            <v-col cols="12" md="4" class="d-flex align-center">
                                <v-btn
                                    color="success"
                                    @click="fetchWeatherForSelected"
                                    :disabled="!selected"
                                >
                                    Hae sää
                                </v-btn>
                            </v-col>
                            <v-col cols="12" md="4" class="d-flex flex-column align-center">
                                <div class="mb-2 small">Haku: {{ searchQuery }}</div>
                                <v-btn
                                    color="success"
                                    :disabled="!searchQuery"
                                    @click="fetchCities"
                                >
                                    HAE KAUPUNGIT
                                </v-btn>
                            </v-col>
                        </v-row>

                        <v-row class="mt-4">
                            <v-col cols="12">
                                <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
                                <v-progress-linear
                                    v-if="loading"
                                    indeterminate
                                    color="success"
                                ></v-progress-linear>

                                <v-card v-if="weather" class="mt-4">
                                    <v-card-title>{{ weather.place }}</v-card-title>
                                    <v-card-text>
                                        <div>
                                            Latitude: {{ weather.latitude }}, Longitude:
                                            {{ weather.longitude }}
                                        </div>
                                        <div>Temp max (next): {{ weather.temp_max }}°C</div>
                                        <div>Temp min (next): {{ weather.temp_min }}°C</div>
                                        <div>
                                            Precip sum (next): {{ weather.precipitation_sum }} mm
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <v-row class="mt-6">
                            <v-col cols="12">
                                <v-card>
                                    <v-card-title>Suosituimmat paikkakunnat</v-card-title>
                                    <v-card-text>
                                        <v-list class="city-list">
                                            <v-list-item
                                                v-for="(c, i) in topCities"
                                                :key="i"
                                                class="city-item"
                                                @click="setFromTop(c)"
                                            >
                                                <v-list-item-title class="text-center">{{
                                                    c.display_name
                                                }}</v-list-item-title>
                                            </v-list-item>
                                        </v-list>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const selected = ref(null);
const searchQuery = ref('');
const searchResults = ref([]);
const searching = ref(false);
const loading = ref(false);
const error = ref('');
const weather = ref(null);

// default top cities (some sample geocoding objects)
const topCities = ref([
    { display_name: 'London, England', lat: 51.5085, lon: -0.1257 },
    { display_name: 'Helsinki, Finland', lat: 60.1699, lon: 24.9384 },
    { display_name: 'Tampere, Finland', lat: 61.4981, lon: 23.761 },
    { display_name: 'Turku, Finland', lat: 60.4518, lon: 22.2666 },
    { display_name: 'Oulu, Finland', lat: 65.0121, lon: 25.4651 },
]);

async function searchPlaces(query) {
    if (!query) {
        searchResults.value = [];
        return;
    }
    searching.value = true;
    error.value = '';
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        );
        if (!res.ok) throw new Error('Geokoodaus epäonnistui');
        const data = await res.json();
        // log raw payload and any result/results key for debugging
        console.log('geocode raw response:', data);
        console.log('geocode data.result:', data.result ?? data.results ?? data);
        // map to consistent shape - support multiple APIs that return result/results or a top-level array
        const items = data.result ?? data.results ?? data;
        searchResults.value = (items || []).map((d) => ({
            display_name: d.display_name || d.name || '',
            lat: parseFloat(d.lat || d.latitude),
            lon: parseFloat(d.lon || d.longitude),
        }));
    } catch (err) {
        console.error(err);
        error.value = 'Paikkahaku epäonnistui';
    } finally {
        searching.value = false;
    }
}

let searchDebounce = null;
function onSelect(val) {
    // If user selected an object from the dropdown, fetch its weather immediately
    if (val && typeof val === 'object' && val.lat && val.lon) {
        selected.value = val;
        // keep the typed query in sync with selection
        searchQuery.value = val.display_name || '';
        fetchWeather(val.lat, val.lon, val.display_name);
        return;
    }

    // when user types, v-autocomplete triggers update; debounce the search
    const query = typeof val === 'string' ? val : val?.display_name || '';
    searchQuery.value = query;
    if (searchDebounce) clearTimeout(searchDebounce);
    if (!query) return;
    searchDebounce = setTimeout(() => searchPlaces(query), 300);
}

async function fetchWeather(lat, lon, placeName) {
    loading.value = true;
    error.value = '';
    weather.value = null;
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,precipitation_probability_max,precipitation_hours,temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Säädataa ei saatu');
        const j = await res.json();
        // pick daily summary first day
        const daily = j.daily || {};
        weather.value = {
            place: placeName,
            latitude: lat,
            longitude: lon,
            temp_max: daily.temperature_2m_max?.[0],
            temp_min: daily.temperature_2m_min?.[0],
            precipitation_sum: daily.precipitation_sum?.[0],
        };
    } catch (err) {
        console.error(err);
        error.value = 'Sään haku epäonnistui';
    } finally {
        loading.value = false;
    }
}

function setFromTop(c) {
    selected.value = c;
    fetchWeather(c.lat, c.lon, c.display_name);
}

function fetchWeatherForSelected() {
    const item = selected.value;
    if (!item) return;
    // if selected is object from searchResults
    const lat = item.lat || item.latitude || item.lat;
    const lon = item.lon || item.longitude || item.lon;
    const name = item.display_name || item.name || item;
    fetchWeather(lat, lon, name);
}

async function fetchCities() {
    const query =
        typeof selected.value === 'string' ? selected.value : selected.value?.display_name || '';
    if (!query) {
        console.warn('Ei hakusanaa annettu');
        return;
    }
    // run search (searchPlaces already sets searchResults and logs raw response)
    await searchPlaces(query);
    // log the mapped array of places
    console.log('HAETUT KAUPUNGIT:', searchResults.value);
    // convenience: expose to window for easy console filtering
    try {
        window.lastSearchResults = searchResults.value;
    } catch {
        /* ignore if not allowed */
    }
}

onMounted(() => {
    // default to London as requested
    const london = topCities.value[0];
    selected.value = london;
    fetchWeather(london.lat, london.lon, london.display_name);
});
</script>

<style scoped>
.city-list {
    max-height: 250px;
    overflow-y: auto;
}
.city-item {
    border: 1px solid rgba(76, 175, 80, 0.6);
    margin: 6px 0;
    border-radius: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.02);
}
.city-item:hover {
    cursor: pointer;
    background: rgba(255, 255, 255, 0.03);
}
</style>
