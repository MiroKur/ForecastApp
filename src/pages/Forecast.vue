<!-- 
  Forecast.vue - Sääviennon näkymä
  
  OSIEN LINKIT:
  1. Hakukenttä (searchPhrase) -> onSearchPhraseInput -> 500ms timeout -> searchCities() -> searchResults
  2. searchResults (lista) -> @click -> setCity() -> selectedCity -> fetchWeather()
  3. fetchWeather() täyttää weather-objektin joka näytetään templateissa
  4. Komponentin avautuessa (onMounted) ladataan automaattisesti Lontoon säädata
  5. Takaisin-painike (@click="goBack") navigoi index-sivulle
-->

<template>
    <v-container class="py-8">
        <v-row justify="center">
            <v-col cols="12" md="8">
                <v-card>
                    <!-- Otsikko-rivi: takaisin-painike vasemmalla, otsikko keskellä -->
                    <v-card-title class="justify-center">
                        <v-row align="center">
                            <!-- Takaisin-painike: kutsuu goBack()-funktiota joka navigoi index-sivulle -->
                            <v-col cols="2">
                                <v-btn icon @click="goBack">
                                    <v-icon>mdi-arrow-left</v-icon>
                                </v-btn>
                            </v-col>
                            <v-col cols="8" class="text-center">Paikkakunta & Sää</v-col>
                            <v-col cols="2" class="d-flex justify-end">
                                <!-- Painike siirtymään lisätietoihin -->
                                <v-btn color="secondary" variant="outlined" @click="goDetails">
                                    Lisätiedot
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-card-title>
                    <v-card-text>
                        <!-- HAKU-OSIO: Hakukenttä ja painike -->
                        <v-row>
                            <v-col cols="12" md="8">
                                <!-- 
                                  Hakukenttä:
                                  - v-model="searchPhrase" sitoo kenttään kirjoitetun tekstin
                                  - @input="onSearchPhraseInput" käynnistyy jokaisen merkin jälkeen
                                  - @keydown.enter.prevent="onEnterPress" käsittelee Enter-näppäimen painalluksen
                                  Flow: Kirjoitus -> onSearchPhraseInput -> 500ms timeout -> searchCities -> searchResults päivittyy
                                -->
                                <v-text-field
                                    v-model="searchPhrase"
                                    label="Paikkakunta"
                                    placeholder="Kirjoita kaupunki (esim. Tornio)"
                                    hide-details
                                    clearable
                                    @input="onSearchPhraseInput"
                                    @keydown.enter.prevent="onEnterPress"
                                />
                            </v-col>
                            <v-col cols="12" md="4" class="d-flex align-center">
                                <!-- HAE-painike: kutsuu searchCities() manuaalisesti (disabled kunnes hakusana on kirjoitettu) -->
                                <v-btn
                                    color="success"
                                    :disabled="!searchPhrase || loading"
                                    @click="searchCities"
                                >
                                    HAE
                                </v-btn>
                            </v-col>
                        </v-row>

                        <!-- Virheilmoitus ja lataus-indikaattori -->
                        <v-row class="mt-4">
                            <v-col cols="12">
                                <!-- Näytetään virhe-alert jos error-ref:ssä on data -->
                                <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
                                <!-- Näytetään lataus-palkki kun loading on true -->
                                <v-progress-linear
                                    v-if="loading"
                                    indeterminate
                                    color="success"
                                ></v-progress-linear>
                            </v-col>
                        </v-row>

                        <!-- TULOSTEN JA SÄÄTIEDON OSIO -->
                        <v-row class="mt-4">
                            <!-- VASEN SARAKE: Hakutulokset lista -->
                            <v-col cols="12" md="6">
                                <!-- Näytetään hakutulokset jos niitä on (v-if="searchResults.length") -->
                                <v-card v-if="searchResults.length" class="mb-4">
                                    <v-card-title>Osuvat paikat</v-card-title>
                                    <v-card-text>
                                        <!-- 
                                          Lista hakutuloksista:
                                          - v-for="(city, index) in searchResults" iteroi searchResults-arrayn
                                          - @click="setCity(city)" kutsuu setCity()-funktiota joka:
                                            1. Asettaa selectedCity = city
                                            2. Kutsuu fetchWeather() haetaan säädata koordinaateista
                                          - Linkki: hakukenttä -> searchResults -> setCity() -> selectedCity -> fetchWeather()
                                        -->
                                        <v-list class="city-list">
                                            <v-list-item
                                                v-for="(city, index) in searchResults"
                                                :key="city.id ?? index"
                                                class="city-item"
                                                @click="setCity(city)"
                                            >
                                                <div class="city-item-text">
                                                    <div class="city-item-title">
                                                        {{ city.name }}
                                                    </div>
                                                    <div class="city-item-subtitle">
                                                        {{ city.country }}
                                                    </div>
                                                </div>
                                            </v-list-item>
                                        </v-list>
                                    </v-card-text>
                                </v-card>
                                <!-- Näytetään ohjeteksti jos hakutuloksia ei ole -->
                                <div v-else class="small">
                                    Kirjoita hakusana ja paina HAE niin kaikki osuvat kaupungit
                                    tulevat listalle.
                                </div>
                            </v-col>

                            <!-- OIKEA SARAKE: Valitun kaupungin säätiedot -->
                            <v-col cols="12" md="6">
                                <!-- 
                                  Kaupungin tiedot:
                                  - Näytetään vain jos selectedCity on valittu (v-if="selectedCity")
                                  - selectedCity täyttyy kun käyttäjä klikkaa hakutuloksia tai painaa Enter
                                -->
                                <v-card v-if="selectedCity" class="mb-4">
                                    <v-card-title class="d-flex align-center">
                                        <v-icon class="me-2">mdi-map-marker</v-icon>
                                        {{ selectedCity.name }}, {{ selectedCity.country }}
                                    </v-card-title>
                                    <v-card-text>
                                        <div class="mb-3">
                                            <v-icon small class="me-1">mdi-crosshairs-gps</v-icon>
                                            lat: {{ selectedCity.latitude }}, lon:
                                            {{ selectedCity.longitude }}
                                        </div>

                                        <!-- Nykyisen päivän sadetiedot -->
                                        <div v-if="weather" class="current-weather-card pa-3 mb-3">
                                            <h4 class="mb-3">
                                                <v-icon class="me-2"
                                                    >mdi-weather-partly-cloudy</v-icon
                                                >
                                                Tämän päivän sää ({{
                                                    formatDate(weather.forecast[0]?.date)
                                                }})
                                            </h4>
                                            <v-row>
                                                <v-col cols="6" sm="3">
                                                    <div class="weather-stat">
                                                        <v-icon color="blue"
                                                            >mdi-thermometer</v-icon
                                                        >
                                                        <div class="stat-value">
                                                            {{ weather.temp_max }}°C
                                                        </div>
                                                        <div class="stat-label">Max lämpötila</div>
                                                    </div>
                                                </v-col>
                                                <v-col cols="6" sm="3">
                                                    <div class="weather-stat">
                                                        <v-icon color="blue"
                                                            >mdi-thermometer-low</v-icon
                                                        >
                                                        <div class="stat-value">
                                                            {{ weather.temp_min }}°C
                                                        </div>
                                                        <div class="stat-label">Min lämpötila</div>
                                                    </div>
                                                </v-col>
                                                <v-col cols="6" sm="3">
                                                    <div class="weather-stat">
                                                        <v-icon
                                                            :color="
                                                                getRainIconColor(
                                                                    weather.precipitation_sum,
                                                                )
                                                            "
                                                            >mdi-weather-rainy</v-icon
                                                        >
                                                        <div class="stat-value">
                                                            {{ weather.precipitation_sum }} mm
                                                        </div>
                                                        <div class="stat-label">Sade</div>
                                                    </div>
                                                </v-col>
                                                <v-col cols="6" sm="3">
                                                    <div class="weather-stat">
                                                        <v-icon
                                                            :color="
                                                                getRainProbabilityColor(
                                                                    weather.precipitation_probability_max,
                                                                )
                                                            "
                                                            >mdi-weather-pouring</v-icon
                                                        >
                                                        <div class="stat-value">
                                                            {{
                                                                weather.precipitation_probability_max
                                                            }}%
                                                        </div>
                                                        <div class="stat-label">
                                                            Sateen todennäköisyys
                                                        </div>
                                                    </div>
                                                </v-col>
                                            </v-row>
                                        </div>
                                    </v-card-text>
                                </v-card>

                                <!-- 
                                  7 PÄIVÄN ENNUSTE:
                                  - Näytetään vain jos weather.forecast-array on olemassa ja siinä on dataa
                                  - weather.forecast täyttyy fetchWeather()-funktiossa mappaamalla päivät
                                  - Näyttää sadetiedot ikonien ja värien kanssa
                                -->
                                <v-card v-if="selectedCity && weather?.forecast?.length">
                                    <v-card-title class="d-flex align-center">
                                        <v-icon class="me-2">mdi-calendar-week</v-icon>
                                        7 päivän sade-ennuste - {{ selectedCity.name }}
                                    </v-card-title>
                                    <v-card-text>
                                        <v-row>
                                            <!-- Näytetään 7 päivää kortteina -->
                                            <v-col
                                                v-for="(day, index) in weather.forecast"
                                                :key="day.date"
                                                cols="12"
                                                sm="6"
                                                md="4"
                                                lg="3"
                                            >
                                                <v-card
                                                    :class="[
                                                        'forecast-card pa-3 mb-3',
                                                        { 'today-card': index === 0 },
                                                    ]"
                                                >
                                                    <div class="forecast-date mb-2">
                                                        <v-icon small class="me-1"
                                                            >mdi-calendar</v-icon
                                                        >
                                                        {{ formatDate(day.date) }}
                                                        <span v-if="index === 0" class="today-badge"
                                                            >Tänään</span
                                                        >
                                                    </div>

                                                    <!-- Lämpötilat -->
                                                    <div class="temp-row mb-2">
                                                        <v-icon small color="red" class="me-1"
                                                            >mdi-thermometer</v-icon
                                                        >
                                                        <span class="temp-max"
                                                            >{{ day.temp_max }}°</span
                                                        >
                                                        <v-icon small color="blue" class="mx-1"
                                                            >mdi-thermometer-low</v-icon
                                                        >
                                                        <span class="temp-min"
                                                            >{{ day.temp_min }}°</span
                                                        >
                                                    </div>

                                                    <!-- Sade -->
                                                    <div class="rain-row">
                                                        <v-icon
                                                            :color="
                                                                getRainIconColor(
                                                                    day.precipitation_sum,
                                                                )
                                                            "
                                                            class="me-1"
                                                        >
                                                            mdi-weather-rainy
                                                        </v-icon>
                                                        <span class="rain-amount"
                                                            >{{ day.precipitation_sum }} mm</span
                                                        >
                                                    </div>

                                                    <!-- Sateen todennäköisyys -->
                                                    <div class="rain-prob-row mt-1">
                                                        <v-icon
                                                            small
                                                            :color="
                                                                getRainProbabilityColor(
                                                                    day.precipitation_probability_max,
                                                                )
                                                            "
                                                            class="me-1"
                                                        >
                                                            mdi-weather-pouring
                                                        </v-icon>
                                                        <span class="rain-prob"
                                                            >{{
                                                                day.precipitation_probability_max
                                                            }}%</span
                                                        >
                                                    </div>
                                                </v-card>
                                            </v-col>
                                        </v-row>
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
// IMPORTIT: Vue-komponentit ja Vue Router navigoinnille
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// NAVIGOINTI: useRouter käytetään siirtymiseen eri sivuille (esim. takaisin index-sivulle)
const router = useRouter();

/**
 * REAKTIIVISET MUUTTUJAT (REF):
 * Nämä linkittyvät toisiinsa ja muodostavat sovelluksen tilan
 */

// Hakukenttään kirjoitettu teksti (sitoo hakukenttään @input-tapahtumalla)
const searchPhrase = ref('');

// Hakutulosten lista: täyttyy searchCities()-funktiossa ja näytetään v-for-loopissa
const searchResults = ref([]);

// Valittu kaupunki: täyttyy kun käyttäjä klikkaa hakutuloksessa tai painaa Enter
// Kun selectedCity muuttuu -> fetchWeather() kutsutaan ja säädata haetaan
const selectedCity = ref(null);

// Latauksen indikaattori: true kun API-kutsuja tehdään, false kun valmis
const loading = ref(false);

// Virheviesti: näytetään v-alert-komponentissa jos ongelma tapahtuu
const error = ref('');

// Säädata: täyttyy fetchWeather()-funktiossa ja näytetään weather-otsikon alla
const weather = ref(null);
let latestWeatherRequest = 0;

// Timeout-muuttuja: käytetään debounce-mekanismiin (500ms viive hakusanaan)
let searchTimeout = null;

/**
 * NAVIGOINTI: Takaisin-painike
 * - Kutsutaan kun käyttäjä klikkaa arrow-left-painiketta
 * - Navigoi index-sivulle (reitti: 'Home')
 */
function goBack() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
    }
    router.push({ name: 'Home' });
}

// Navigoi suoraan Details-sivulle.
function goDetails() {
    router.push({ name: 'Details' });
}

/**
 * KOMPONENTTIN ALUSTUS: onMounted hook
 * - Suoritetaan kun komponentti on ladattu
 * - Lataa automaattisesti Lontoon säädata
 * FLOW: Komponentti avautuu -> onMounted() -> Asetetaan London selectedCity:ksi -> fetchWeather()
 */
onMounted(() => {
    const london = {
        id: 'london',
        name: 'London',
        country: 'United Kingdom',
        latitude: 51.5085,
        longitude: -0.1257,
    };
    // Asetetaan Lontoo oletuskaupungiksi
    selectedCity.value = london;
    searchPhrase.value = 'London';
    // Haetaan Lontoon säädata
    fetchWeather(london.latitude, london.longitude, `${london.name}, ${london.country}`);
});

/**
 * HAKUFUNKTIO: searchCities()
 * - Kutsutaan: 1) automaattisesti 500ms viiveen jälkeen (onSearchPhraseInput -> setTimeout)
 *              2) manuaalisesti Enter-näppäimellä (onEnterPress)
 *              3) HAE-painikkeella
 * - Parametri selectFirst: onko ensimmäinen osuma valittava automaattisesti
 * FLOW: searchPhrase -> searchCities() -> API-kutsu -> searchResults täyttyy -> näytetään listassa
 */
async function searchCities(selectFirst = false) {
    const query = searchPhrase.value?.trim();
    if (!query) {
        error.value = 'Kirjoita hakusana ensin';
        searchResults.value = [];
        selectedCity.value = null;
        return;
    }

    loading.value = true; // Näytetään lataus-palkki
    error.value = '';
    searchResults.value = [];

    try {
        // API-kutsu: Open-Meteo geocoding API
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=30&language=fi`,
        );
        if (!response.ok) throw new Error('Geokoodaus epäonnistui');

        const data = await response.json();
        const results = data.results || [];

        // Suodatetaan tulokset: sisältävät hakusanan (name, admin1 tai country)
        const filtered = results.filter((item) =>
            `${item.name} ${item.admin1 ?? ''} ${item.country}`
                .toLowerCase()
                .includes(query.toLowerCase()),
        );

        if (!filtered.length) {
            error.value = 'Paikkoja ei löytynyt';
            selectedCity.value = null;
            return;
        }

        // Muodostetaan standardoitu objekti jokaiselle kaupungille
        searchResults.value = filtered.map((item) => ({
            id: item.id ?? `${item.latitude}-${item.longitude}`,
            name: item.name,
            country: item.country,
            latitude: item.latitude,
            longitude: item.longitude,
        }));

        // Jos selectFirst=true, valitaan ensimmäinen osuma listasta, mutta haetaan säädata vasta erikseen
        if (selectFirst) {
            const firstCity = searchResults.value[0] || null;
            if (firstCity) {
                selectedCity.value = firstCity;
            }
        }
    } catch {
        error.value = 'Paikkahaku epäonnistui';
    } finally {
        loading.value = false; // Piillotetaan lataus-palkki
    }
}

/**
 * HAKUKENTÄN INPUTTAPAHTUMA: onSearchPhraseInput()
 * - Kutsutaan jokaisen kirjoitettavan merkin jälkeen (@input="onSearchPhraseInput")
 * - Toteuttaa debounce-mekanismin (500ms viive) vähentääkseen API-kutsuja
 * FLOW: Kirjoitus -> onSearchPhraseInput -> clearTimeout -> setTimeout(500ms) -> searchCities(true)
 */
function onSearchPhraseInput() {
    // Peruutetaan aiempi timeout (jos käyttäjä kirjoittaa enemmän)
    if (searchTimeout) clearTimeout(searchTimeout);

    // Jos hakukenttä on tyhjä, tyhjennetään tulokset
    if (!searchPhrase.value.trim()) {
        searchResults.value = [];
        selectedCity.value = null;
        return;
    }

    // Asetetaan uusi timeout: 500ms viiveen jälkeen kutsutaan searchCities
    searchTimeout = setTimeout(() => {
        searchCities(false); // Hae vain hakutulokset, ei automaattista säädataa
    }, 500);
}

/**
 * ENTER-NÄPPÄIN: onEnterPress()
 * - Kutsutaan kun Enter painetaan hakukentässä (@keydown.enter.prevent)
 * - Hakee tulokset ja valitsee ensimmäisen (jos ei ole hakutuloksia)
 * - Kutsuu setCity() joka lataa säädata
 * FLOW: Enter -> onEnterPress() -> searchCities(false) -> setCity(ensimmäinen) -> fetchWeather()
 */
async function onEnterPress() {
    if (!searchPhrase.value.trim()) {
        error.value = 'Kirjoita hakusana ensin';
        return;
    }

    // Keskeytetään odottava debounce, koska Enter hakemaan heti
    if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
    }

    // Jos hakutuloksia ei ole vielä, haetaan ne
    if (!searchResults.value.length) {
        await searchCities(false);
    }

    // Valitaan ensimmäinen hakutulos (haetaan säädata)
    if (searchResults.value.length) {
        setCity(searchResults.value[0]);
    }
}

/**
 * KAUPUNGIN VALINTA: setCity()
 * - Kutsutaan kun käyttäjä klikkaa hakutulosta listassa (@click="setCity(city)")
 * - Asettaa selectedCity ja kutsuu fetchWeather() haetaan säädata
 * FLOW: Klikkaus hakutuloksessa -> setCity() -> selectedCity asetetaan -> fetchWeather() kutsutaan
 */
function setCity(city) {
    // Keskeytetään odottava debounce, jotta valinta ei kumoa itse haettua kaupunkia
    if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
    }

    selectedCity.value = city; // Asetetaan valittu kaupunki
    searchResults.value = []; // Piilotetaan hakutulokset valinnan jälkeen
    // Haetaan säädata koordinaateista
    fetchWeather(city.latitude, city.longitude, `${city.name}, ${city.country}`);
}

/**
 * SÄÄDATA HAKU: fetchWeather()
 * - Kutsutaan kun kaupunki valitaan (setCity) tai Lontoo ladataan (onMounted)
 * - Parametrit: lat, lon (koordinaatit), placeName (näkyvä nimi)
 * - Hakee 7 päivän ennusteen Open-Meteo API:sta
 * - Mappaa päivät weather.forecast-arrayhin
 * FLOW: fetchWeather() -> API-kutsu -> weather täyttyy -> näytetään 7 päivän ennuste
 */
async function fetchWeather(lat, lon, placeName) {
    loading.value = true; // Näytetään lataus-palkki
    error.value = '';
    weather.value = null;
    const requestId = ++latestWeatherRequest;

    try {
        // API-kutsu: Open-Meteo forecast API - LISÄTTY precipitation_probability_max
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto`,
        );
        if (!response.ok) throw new Error('Sään haku epäonnistui');

        const data = await response.json();
        if (requestId !== latestWeatherRequest) return;

        // Muodostetaan forecast-array mappaamalla päivät
        const forecast = (data.daily?.time || []).map((date, index) => ({
            date,
            temp_max: data.daily.temperature_2m_max?.[index] ?? null,
            temp_min: data.daily.temperature_2m_min?.[index] ?? null,
            precipitation_sum: data.daily.precipitation_sum?.[index] ?? null,
            precipitation_probability_max:
                data.daily.precipitation_probability_max?.[index] ?? null,
        }));

        // Asetetaan weather-objekti (käytetään templateissa)
        weather.value = {
            place: placeName,
            latitude: lat,
            longitude: lon,
            temp_max: forecast[0]?.temp_max ?? null, // Ensimmäisen päivän maksimi
            temp_min: forecast[0]?.temp_min ?? null, // Ensimmäisen päivän minimi
            precipitation_sum: forecast[0]?.precipitation_sum ?? null, // Ensimmäisen päivän sade
            precipitation_probability_max: forecast[0]?.precipitation_probability_max ?? null, // Sateen todennäköisyys
            forecast, // Koko 7 päivän array
        };
    } catch {
        error.value = 'Sään haku epäonnistui';
    } finally {
        loading.value = false; // Piillotetaan lataus-palkki
    }
}

/**
 * APUFUNKTIOT: Visuaalinen esitys
 */

/**
 * PÄIVÄMÄÄRÄN FORMATOINTI: formatDate()
 * - Muuntaa ISO-päivämäärän (2024-01-15) suomalaiseen muotoon (15.1.)
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fi-FI', {
        day: 'numeric',
        month: 'numeric',
    });
}

/**
 * SADE-IKONIN VÄRI: getRainIconColor()
 * - Palauttaa värin sademäärän perusteella
 * - 0mm: harmaa, 0-2mm: sininen, 2-5mm: oranssi, >5mm: punainen
 */
function getRainIconColor(precipitation) {
    if (precipitation === null || precipitation === undefined) return 'grey';
    if (precipitation === 0) return 'grey';
    if (precipitation < 2) return 'blue';
    if (precipitation < 5) return 'orange';
    return 'red';
}

/**
 * SATEEN TODENNÄKÖISYYDEN VÄRI: getRainProbabilityColor()
 * - Palauttaa värin todennäköisyyden perusteella
 * - <30%: vihreä, 30-60%: keltainen, >60%: punainen
 */
function getRainProbabilityColor(probability) {
    if (probability === null || probability === undefined) return 'grey';
    if (probability < 30) return 'green';
    if (probability < 60) return 'yellow';
    return 'red';
}
</script>

<style scoped>
/**
 * TYYLIT: Hakutulosten ja ennusteen visuaalinen tyyli
 */

/* Hakutulosten lista: rajoitettu korkeus ja scrollaus */
.city-list {
    max-height: 250px;
    overflow-y: auto;
}

/* Yksittäinen hakutulos: klikattava rivi */
.city-item {
    border: 1px solid rgba(76, 175, 80, 0.6);
    margin: 6px 0;
    border-radius: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.02);
}

/* Hover-efekti: näyttää että rivi on klikattava */
.city-item:hover {
    cursor: pointer;
    background: rgba(255, 255, 255, 0.03);
}

/* 7 päivän ennusteen kortit: vihreä tausta ja raja */
.forecast-card {
    background: rgba(76, 175, 80, 0.08);
    border: 1px solid rgba(76, 175, 80, 0.25);
}

/* Päivämäärä ennusteen kortissa: vahva teksti */
.forecast-date {
    font-weight: 600;
    margin-bottom: 8px;
}

/* Nykyisen päivän sääkortti */
.current-weather-card {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(76, 175, 80, 0.1));
    border: 1px solid rgba(33, 150, 243, 0.3);
    border-radius: 12px;
}

/* Säätilastojen tyyli */
.weather-stat {
    text-align: center;
    padding: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    margin-bottom: 8px;
}

.weather-stat .stat-value {
    font-size: 1.2em;
    font-weight: bold;
    display: block;
    margin: 4px 0;
}

.weather-stat .stat-label {
    font-size: 0.8em;
    color: rgba(255, 255, 255, 0.7);
}

/* Ennusteen kortit */
.forecast-card {
    background: rgba(76, 175, 80, 0.08);
    border: 1px solid rgba(76, 175, 80, 0.25);
    transition: transform 0.2s ease;
}

.forecast-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Tämän päivän kortti: korostettu */
.today-card {
    border-color: rgba(255, 152, 0, 0.5);
    background: rgba(255, 152, 0, 0.1);
}

.today-badge {
    background: rgba(255, 152, 0, 0.8);
    color: white;
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 0.7em;
    margin-left: 8px;
}

/* Lämpötilojen rivi */
.temp-row {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
}

.temp-max {
    color: #ff5722;
    font-weight: bold;
    margin-right: 8px;
}

.temp-min {
    color: #2196f3;
    font-weight: bold;
}

/* Sade rivit */
.rain-row {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 4px;
}

.rain-amount {
    margin-left: 4px;
}

.rain-prob-row {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9em;
}

.rain-prob {
    margin-left: 4px;
    font-weight: 500;
}
</style>
