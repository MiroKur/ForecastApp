<template>
    <v-container class="py-8">
        <v-row justify="center">
            <v-col cols="12" md="8">
                <v-card>
                    <v-card-title class="justify-center">Paikkakunta & Sää</v-card-title>
                    <v-card-text>
                        <v-row>
                            <v-col cols="12" md="8">
                                <v-text-field
                                    v-model="searchPhrase"
                                    label="Paikkakunta"
                                    placeholder="Kirjoita kaupunki (esim. Tornio)"
                                    hide-details
                                    clearable
                                />
                            </v-col>
                            <v-col cols="12" md="4" class="d-flex align-center">
                                <v-btn
                                    color="success"
                                    :disabled="!searchPhrase || loading"
                                    @click="searchCities"
                                >
                                    HAE
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
                            </v-col>
                        </v-row>

                        <v-row class="mt-4">
                            <v-col cols="12" md="6">
                                <v-card v-if="searchResults.length" class="mb-4">
                                    <v-card-title>Osuvat paikat</v-card-title>
                                    <v-card-text>
                                        <v-list class="city-list">
                                            <v-list-item
                                                v-for="(city, index) in searchResults"
                                                :key="city.id ?? index"
                                                class="city-item"
                                                @click="setCity(city)"
                                            >
                                                <v-list-item-content>
                                                    <v-list-item-title>{{
                                                        city.name
                                                    }}</v-list-item-title>
                                                    <v-list-item-subtitle>{{
                                                        city.country
                                                    }}</v-list-item-subtitle>
                                                </v-list-item-content>
                                            </v-list-item>
                                        </v-list>
                                    </v-card-text>
                                </v-card>
                                <div v-else class="small">
                                    Kirjoita hakusana ja paina HAE niin kaikki osuvat kaupungit
                                    tulevat listalle.
                                </div>
                            </v-col>

                            <v-col cols="12" md="6">
                                <v-card v-if="selectedCity" class="mb-4">
                                    <v-card-title
                                        >{{ selectedCity.name }},
                                        {{ selectedCity.country }}</v-card-title
                                    >
                                    <v-card-text>
                                        <div>
                                            lat: {{ selectedCity.latitude }}, lon:
                                            {{ selectedCity.longitude }}
                                        </div>
                                        <div v-if="weather">
                                            Temp max (next): {{ weather.temp_max }}°C
                                        </div>
                                        <div v-if="weather">
                                            Temp min (next): {{ weather.temp_min }}°C
                                        </div>
                                        <div v-if="weather">
                                            Precip sum (next): {{ weather.precipitation_sum }} mm
                                        </div>
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
import { ref } from 'vue';

const searchPhrase = ref('');
const searchResults = ref([]);
const selectedCity = ref(null);
const loading = ref(false);
const error = ref('');
const weather = ref(null);

async function searchCities() {
    const query = searchPhrase.value?.trim();
    if (!query) {
        error.value = 'Kirjoita hakusana ensin';
        return;
    }

    loading.value = true;
    error.value = '';
    searchResults.value = [];

    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=fi`,
        );
        if (!response.ok) throw new Error('Geokoodaus epäonnistui');

        const data = await response.json();
        const results = data.results || [];
        const filtered = results.filter((item) =>
            `${item.name} ${item.admin1 ?? ''} ${item.country}`
                .toLowerCase()
                .includes(query.toLowerCase()),
        );

        if (!filtered.length) {
            error.value = 'Paikkoja ei löytynyt';
            return;
        }

        searchResults.value = filtered.map((item) => ({
            id: item.id,
            name: item.name,
            country: item.country,
            latitude: item.latitude,
            longitude: item.longitude,
        }));
    } catch (err) {
        console.error(err);
        error.value = 'Paikkahaku epäonnistui';
    } finally {
        loading.value = false;
    }
}

function setCity(city) {
    selectedCity.value = city;
    fetchWeather(city.latitude, city.longitude, `${city.name}, ${city.country}`);
}

async function fetchWeather(lat, lon, placeName) {
    loading.value = true;
    error.value = '';
    weather.value = null;

    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`,
        );
        if (!response.ok) throw new Error('Sään haku epäonnistui');

        const data = await response.json();

        weather.value = {
            place: placeName,
            latitude: lat,
            longitude: lon,
            temp_max: data.daily?.temperature_2m_max?.[0] ?? null,
            temp_min: data.daily?.temperature_2m_min?.[0] ?? null,
            precipitation_sum: data.daily?.precipitation_sum?.[0] ?? null,
        };
    } catch (err) {
        console.error(err);
        error.value = 'Sään haku epäonnistui';
    } finally {
        loading.value = false;
    }
}
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
