<!--
  Forecast.vue - Sade-ennustesivu

  TÄMÄ KOMPONENTTI TEKEE 5 PÄÄASIAA:

  1) Näyttää hakukentän, johon käyttäjä voi kirjoittaa kaupungin nimen
  2) Hakee Open-Meteo Geocoding API:sta osuvat paikat
  3) Antaa käyttäjän valita kaupungin hakutuloksista
  4) Hakee Open-Meteo Forecast API:sta 7 päivän sää- ja sadetiedot
  5) Näyttää tämän päivän tiedot + 7 päivän ennusteen korteissa

  KOKO DATAFLOW PÄHKINÄNKUORESSA:

  searchPhrase
    -> käyttäjä kirjoittaa hakukenttään
    -> onSearchPhraseInput()
    -> 500ms debounce
    -> searchCities()
    -> searchResults täyttyy
    -> käyttäjä klikkaa setCity(city)
    -> selectedCity päivittyy
    -> fetchWeather(lat, lon, placeName)
    -> weather täyttyy
    -> template näyttää tämän päivän sään + 7 päivän ennusteen

  HUOM:
  - Komponentin avatessa ladataan oletuksena London, United Kingdom
  - Sadetunnit (precipitation_hours) haetaan ja näytetään nyt oikein
  - Päivän tekstien väri on muutettu mustaksi, jotta ne näkyvät vaalealla/värillisellä taustalla
-->

<template>
    <v-container class="py-8">
        <v-row justify="center">
            <v-col cols="12" md="10" lg="9">
                <v-card>
                    <!--
                      OTSIKKOALUE
                      - vasemmalla takaisin-painike
                      - keskellä sivun otsikko
                      - oikealla siirtyminen lisätietoihin
                    -->
                    <v-card-title class="justify-center">
                        <v-row align="center">
                            <v-col cols="2">
                                <v-btn icon @click="goBack">
                                    <v-icon>mdi-arrow-left</v-icon>
                                </v-btn>
                            </v-col>

                            <v-col cols="8" class="text-center text-h6 font-weight-bold">
                                Paikkakunta & Sade-ennuste
                            </v-col>

                            <v-col cols="2" class="d-flex justify-end">
                                <v-btn color="secondary" variant="outlined" @click="goDetails">
                                    Lisätiedot
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-card-title>

                    <v-card-text>
                        <!--
                          HAKUALUE

                          Käyttäjä kirjoittaa paikkakunnan nimen.
                          Kun käyttäjä kirjoittaa:
                          - v-model päivittää searchPhrase-arvon
                          - @input kutsuu onSearchPhraseInput()
                          - 500ms viiveen jälkeen tehdään API-haku

                          Käyttäjä voi myös:
                          - painaa Enter -> haetaan heti
                          - klikata HAE-painiketta -> haetaan heti
                        -->
                        <v-row>
                            <v-col cols="12" md="8">
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
                                <v-btn
                                    color="success"
                                    :disabled="!searchPhrase || loading"
                                    @click="searchCities"
                                >
                                    HAE
                                </v-btn>
                            </v-col>
                        </v-row>

                        <!--
                          VIRHEET JA LATAUS

                          error:
                          - jos API-haku epäonnistuu tai paikkoja ei löydy

                          loading:
                          - kun geokoodaus- tai säädatahaku on käynnissä
                        -->
                        <v-row class="mt-4">
                            <v-col cols="12">
                                <v-alert v-if="error" type="error" density="comfortable">
                                    {{ error }}
                                </v-alert>

                                <v-progress-linear v-if="loading" indeterminate color="success" />
                            </v-col>
                        </v-row>

                        <!--
                          SISÄLTÖALUE

                          Vasen sarake:
                          - hakutulokset

                          Oikea sarake:
                          - valitun kaupungin tiedot
                          - tämän päivän sää
                          - 7 päivän sade-ennuste
                        -->
                        <v-row class="mt-4">
                            <!-- HAKUTULOKSET -->
                            <v-col cols="12" md="5">
                                <v-card v-if="searchResults.length" class="mb-4">
                                    <v-card-title>Osuvat paikat</v-card-title>

                                    <v-card-text>
                                        <!--
                                          Jokainen hakutulos on klikattava rivi.
                                          Klikkaus:
                                          -> setCity(city)
                                          -> selectedCity päivittyy
                                          -> fetchWeather() hakee säädatan
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

                                <div v-else class="small">
                                    Kirjoita hakusana ja paina HAE niin osuvat kaupungit näkyvät
                                    tässä listassa.
                                </div>
                            </v-col>

                            <!-- SÄÄTIEDOT -->
                            <v-col cols="12" md="7">
                                <!--
                                  VALITTU KAUPUNKI
                                  Näytetään kun selectedCity löytyy.
                                -->
                                <v-card v-if="selectedCity" class="mb-4">
                                    <v-card-title class="d-flex align-center">
                                        <v-icon class="me-2">mdi-map-marker</v-icon>
                                        {{ selectedCity.name }}, {{ selectedCity.country }}
                                    </v-card-title>

                                    <v-card-text>
                                        <div class="mb-3 city-coords">
                                            <v-icon size="small" class="me-1"
                                                >mdi-crosshairs-gps</v-icon
                                            >
                                            lat: {{ selectedCity.latitude }}, lon:
                                            {{ selectedCity.longitude }}
                                        </div>

                                        <!--
                                          TÄMÄN PÄIVÄN SÄÄ

                                          weather muodostetaan fetchWeather()-funktiossa.
                                          weather.forecast[0] on käytännössä tämän päivän data.
                                        -->
                                        <div v-if="weather" class="current-weather-card pa-4 mb-3">
                                            <h4 class="mb-3 current-weather-title">
                                                <v-icon class="me-2"
                                                    >mdi-weather-partly-cloudy</v-icon
                                                >
                                                Tämän päivän sää ({{
                                                    formatDate(weather.forecast[0]?.date)
                                                }})
                                            </h4>

                                            <v-row>
                                                <v-col cols="6" sm="4" md="4" lg="3">
                                                    <div class="weather-stat">
                                                        <v-icon color="red">mdi-thermometer</v-icon>
                                                        <div class="stat-value">
                                                            {{ weather.temp_max }}°C
                                                        </div>
                                                        <div class="stat-label">Max lämpötila</div>
                                                    </div>
                                                </v-col>

                                                <v-col cols="6" sm="4" md="4" lg="3">
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

                                                <v-col cols="6" sm="4" md="4" lg="3">
                                                    <div class="weather-stat">
                                                        <v-icon
                                                            :color="
                                                                getRainIconColor(
                                                                    weather.precipitation_sum,
                                                                )
                                                            "
                                                        >
                                                            mdi-weather-rainy
                                                        </v-icon>
                                                        <div class="stat-value">
                                                            {{ weather.precipitation_sum }} mm
                                                        </div>
                                                        <div class="stat-label">Sadesumma</div>
                                                    </div>
                                                </v-col>

                                                <v-col cols="6" sm="4" md="4" lg="3">
                                                    <div class="weather-stat">
                                                        <v-icon color="teal">mdi-timer-sand</v-icon>
                                                        <div class="stat-value">
                                                            {{ weather.precipitation_hours ?? 0 }} h
                                                        </div>
                                                        <div class="stat-label">Sadetunnit</div>
                                                    </div>
                                                </v-col>

                                                <v-col cols="6" sm="4" md="4" lg="3">
                                                    <div class="weather-stat">
                                                        <v-icon
                                                            :color="
                                                                getRainProbabilityColor(
                                                                    weather.precipitation_probability_max,
                                                                )
                                                            "
                                                        >
                                                            mdi-weather-pouring
                                                        </v-icon>
                                                        <div class="stat-value">
                                                            {{
                                                                weather.precipitation_probability_max ??
                                                                0
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
                                  7 PÄIVÄN ENNUSTE

                                  Näytetään vain jos:
                                  - selectedCity löytyy
                                  - weather.forecast sisältää rivejä

                                  Jokainen day-olio muodostetaan fetchWeather()-funktiossa.
                                -->
                                <v-card v-if="selectedCity && weather?.forecast?.length">
                                    <v-card-title class="d-flex align-center">
                                        <v-icon class="me-2">mdi-calendar-week</v-icon>
                                        7 päivän sade-ennuste - {{ selectedCity.name }}
                                    </v-card-title>

                                    <v-card-text>
                                        <v-row>
                                            <v-col
                                                v-for="(day, index) in weather.forecast"
                                                :key="day.date"
                                                cols="12"
                                                sm="6"
                                                lg="4"
                                            >
                                                <v-card
                                                    :class="[
                                                        'forecast-card pa-3 mb-3',
                                                        { 'today-card': index === 0 },
                                                    ]"
                                                >
                                                    <!-- Päivämäärä -->
                                                    <div class="forecast-date mb-2">
                                                        <v-icon
                                                            size="small"
                                                            class="me-1 forecast-date-icon"
                                                        >
                                                            mdi-calendar
                                                        </v-icon>
                                                        <span class="forecast-main-text">
                                                            {{ formatDate(day.date) }}
                                                        </span>
                                                        <span v-if="index === 0" class="today-badge"
                                                            >Tänään</span
                                                        >
                                                    </div>

                                                    <!-- Lämpötilat -->
                                                    <div class="temp-row mb-2">
                                                        <v-icon
                                                            size="small"
                                                            color="red"
                                                            class="me-1"
                                                        >
                                                            mdi-thermometer
                                                        </v-icon>
                                                        <span class="temp-max"
                                                            >{{ day.temp_max }}°</span
                                                        >

                                                        <v-icon
                                                            size="small"
                                                            color="blue"
                                                            class="mx-1"
                                                        >
                                                            mdi-thermometer-low
                                                        </v-icon>
                                                        <span class="temp-min"
                                                            >{{ day.temp_min }}°</span
                                                        >
                                                    </div>

                                                    <!-- Sadesumma -->
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
                                                        <span class="forecast-main-text">
                                                            {{ day.precipitation_sum ?? 0 }} mm
                                                        </span>
                                                    </div>

                                                    <!-- Sadetunnit -->
                                                    <div class="rain-hours-row mt-1">
                                                        <v-icon
                                                            size="small"
                                                            color="teal"
                                                            class="me-1"
                                                        >
                                                            mdi-timer-sand
                                                        </v-icon>
                                                        <span class="forecast-main-text">
                                                            {{ day.precipitation_hours ?? 0 }} h
                                                        </span>
                                                    </div>

                                                    <!-- Sateen todennäköisyys -->
                                                    <div class="rain-prob-row mt-1">
                                                        <v-icon
                                                            size="small"
                                                            :color="
                                                                getRainProbabilityColor(
                                                                    day.precipitation_probability_max,
                                                                )
                                                            "
                                                            class="me-1"
                                                        >
                                                            mdi-weather-pouring
                                                        </v-icon>
                                                        <span class="forecast-main-text">
                                                            {{
                                                                day.precipitation_probability_max ??
                                                                0
                                                            }}%
                                                        </span>
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
// Vue-importit:
// onMounted = suoritetaan kun komponentti latautuu
import { onMounted } from 'vue';

// Vue Router navigointiin
import { useRouter } from 'vue-router';

// Pinia-kauppa tilan hallintaan
import { storeToRefs } from 'pinia';
import { useWeatherStore } from '@/stores/weatherStore';

/*
  ROUTER
  Käytetään siirtymään takaisin etusivulle tai details-sivulle
*/
const router = useRouter();

// Pinia state store
const weatherStore = useWeatherStore();
const { searchPhrase, searchResults, selectedCity, loading, error, weather } =
    storeToRefs(weatherStore);

/*
  REAKTIIVISET MUUTTUJAT

  searchPhrase:
  - käyttäjän kirjoittama hakusana

  searchResults:
  - hakutulokset Open-Meteo geocoding API:sta

  selectedCity:
  - käyttäjän valitsema kaupunki
  - sisältää mm. nimen, maan, latitude ja longitude

  loading:
  - true kun jokin API-haku on käynnissä

  error:
  - virheviesti käyttäjälle

  weather:
  - lopullinen säädata, joka näytetään templateissa
*/

/*
  latestWeatherRequest:
  - suojaa tilanteelta, jossa useita säähakuja palautuu väärässä järjestyksessä
  - vain viimeisin request saa päivittää weather-tilan
*/
let latestWeatherRequest = 0;

/*
  searchTimeout:
  - debounce-ajastin
  - estää API-kutsun jokaisella näppäimenpainalluksella
*/
let searchTimeout = null;

/*
  goBack()
  - siirtyy etusivulle
  - samalla tyhjentää mahdollisen debounce-timeoutin
*/
function goBack() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
    }
    router.push({ name: 'Home' });
}

/*
  goDetails()
  - siirtyy Lisätiedot-sivulle
*/
function goDetails() {
    router.push({ name: 'Details' });
}

/*
  onMounted()
  - suoritetaan automaattisesti kun komponentti avautuu
  - asettaa Lontoon oletuskaupungiksi
  - hakee heti Lontoon 7 päivän ennusteen

  Tämä täyttää tehtävänannon kohdan:
  "Sovellus käynnistyy Lontoon sadetiedoilla"
*/
onMounted(() => {
    const london = {
        id: 'london',
        name: 'London',
        country: 'United Kingdom',
        latitude: 51.5085,
        longitude: -0.1257,
    };

    weatherStore.setSelectedCity(london);
    weatherStore.setSearchPhrase('London');

    fetchWeather(london.latitude, london.longitude, `${london.name}, ${london.country}`);
});

/*
  searchCities(selectFirst = false)

  TARKOITUS:
  - hakee kaupungit Open-Meteo geocoding API:sta

  PARAMETRI:
  - selectFirst: jos true, voidaan halutessa asettaa ensimmäinen osuma selectedCityksi

  FLOW:
  searchPhrase -> API -> searchResults -> template näyttää listan
*/
async function searchCities(selectFirst = false) {
    const query = searchPhrase.value?.trim();

    if (!query) {
        weatherStore.setError('Kirjoita hakusana ensin');
        weatherStore.setSearchResults([]);
        weatherStore.setSelectedCity(null);
        return;
    }

    weatherStore.setLoading(true);
    weatherStore.setError('');
    weatherStore.setSearchResults([]);

    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=30&language=fi`,
        );

        if (!response.ok) {
            throw new Error('Geokoodaus epäonnistui');
        }

        const data = await response.json();
        const results = data.results || [];

        /*
          Suodatus:
          - pidetään mukana vain tulokset, joissa hakusana löytyy nimestä,
            hallintoalueesta tai maasta
        */
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

        /*
          Muutetaan API:n tulokset omaan, yhtenäiseen muotoon
          jotta template ja fetchWeather voivat käyttää samoja kenttiä
        */
        weatherStore.setSearchResults(
            filtered.map((item) => ({
                id: item.id ?? `${item.latitude}-${item.longitude}`,
                name: item.name,
                country: item.country,
                latitude: item.latitude,
                longitude: item.longitude,
            })),
        );

        if (selectFirst) {
            const firstCity = searchResults.value[0] || null;
            if (firstCity) {
                weatherStore.setSelectedCity(firstCity);
            }
        }
    } catch {
        error.value = 'Paikkahaku epäonnistui';
    } finally {
        loading.value = false;
    }
}

/*
  onSearchPhraseInput()

  TARKOITUS:
  - debounce-haku hakukentälle

  MIKSI:
  - ilman debouncea API-kutsu lähtisi jokaisella näppäimenpainalluksella
  - nyt odotetaan 500ms ennen hakua

  FLOW:
  käyttäjä kirjoittaa -> vanha timeout perutaan -> uusi timeout -> searchCities()
*/
function onSearchPhraseInput() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    if (!searchPhrase.value.trim()) {
        weatherStore.setSearchResults([]);
        weatherStore.setSelectedCity(null);
        return;
    }

    searchTimeout = setTimeout(() => {
        searchCities(false);
    }, 500);
}

/*
  onEnterPress()

  TARKOITUS:
  - käsittelee Enter-näppäimen
  - hakee tulokset heti
  - jos tuloksia löytyy, valitsee ensimmäisen kaupungin

  FLOW:
  Enter -> searchCities() -> setCity(ensimmäinen osuma)
*/
async function onEnterPress() {
    if (!searchPhrase.value.trim()) {
        error.value = 'Kirjoita hakusana ensin';
        return;
    }

    if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
    }

    if (!searchResults.value.length) {
        await searchCities(false);
    }

    if (searchResults.value.length) {
        setCity(searchResults.value[0]);
    }
}

/*
  setCity(city)

  TARKOITUS:
  - asettaa valitun kaupungin
  - tyhjentää hakutuloslistan
  - käynnistää säähaun

  FLOW:
  klikattu city -> selectedCity -> fetchWeather()
*/
function setCity(city) {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
    }

    weatherStore.setSelectedCity(city);
    weatherStore.setSearchResults([]);

    fetchWeather(city.latitude, city.longitude, `${city.name}, ${city.country}`);
}

/*
  fetchWeather(lat, lon, placeName)

  TARKOITUS:
  - hakee Open-Meteon forecast API:sta 7 päivän tiedot

  TÄRKEÄ KOHTA:
  - daily-parametreissa haetaan myös precipitation_hours
  - tämä oli aiemmin puuttuva vaatimus

  HAKEMME NÄMÄ KENTÄT:
  - temperature_2m_max
  - temperature_2m_min
  - precipitation_sum
  - precipitation_probability_max
  - precipitation_hours

  Lopuksi muodostetaan:
  - forecast = 7 päivän array
  - weather = nykyisen template-rakenteen käyttämä objekti
*/
async function fetchWeather(lat, lon, placeName) {
    weatherStore.setLoading(true);
    weatherStore.setError('');
    weatherStore.setWeather(null);

    const requestId = ++latestWeatherRequest;

    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,precipitation_hours&timezone=auto`,
        );

        if (!response.ok) {
            throw new Error('Sään haku epäonnistui');
        }

        const data = await response.json();

        /*
          Jos tämä ei ole enää viimeisin pyyntö,
          ei päivitetä näkymää vanhalla datalla.
        */
        if (requestId !== latestWeatherRequest) return;

        /*
          Muodostetaan päiväkohtainen ennustearray.
          Open-Meteo palauttaa daily-tiedot taulukoina,
          joten yhdistämme saman indeksin arvot yhdeksi day-olioksi.
        */
        const forecast = (data.daily?.time || []).map((date, index) => ({
            date,
            temp_max: data.daily.temperature_2m_max?.[index] ?? null,
            temp_min: data.daily.temperature_2m_min?.[index] ?? null,
            precipitation_sum: data.daily.precipitation_sum?.[index] ?? null,
            precipitation_probability_max:
                data.daily.precipitation_probability_max?.[index] ?? null,
            precipitation_hours: data.daily.precipitation_hours?.[index] ?? null,
        }));

        /*
          Rakennetaan näkymän käyttämä weather-objekti.
          Ensimmäinen forecast-rivi on käytännössä "tämän päivän" data.
        */
        weatherStore.setWeather({
            place: placeName,
            latitude: lat,
            longitude: lon,
            temp_max: forecast[0]?.temp_max ?? null,
            temp_min: forecast[0]?.temp_min ?? null,
            precipitation_sum: forecast[0]?.precipitation_sum ?? null,
            precipitation_probability_max: forecast[0]?.precipitation_probability_max ?? null,
            precipitation_hours: forecast[0]?.precipitation_hours ?? null,
            forecast,
        });
    } catch {
        weatherStore.setError('Sään haku epäonnistui');
    } finally {
        weatherStore.setLoading(false);
    }
}

/*
  formatDate(dateString)

  Muuttaa API:n päivämäärän suomalaiseen muotoon.
  Esim:
  2026-05-03 -> 3.5.
*/
function formatDate(dateString) {
    if (!dateString) return '';

    const date = new Date(dateString);

    return date.toLocaleDateString('fi-FI', {
        day: 'numeric',
        month: 'numeric',
    });
}

/*
  getRainIconColor(precipitation)

  Antaa ikonille värin sademäärän mukaan:
  - 0 mm -> grey
  - < 2 mm -> blue
  - < 5 mm -> orange
  - >= 5 mm -> red
*/
function getRainIconColor(precipitation) {
    if (precipitation === null || precipitation === undefined) return 'grey';
    if (precipitation === 0) return 'grey';
    if (precipitation < 2) return 'blue';
    if (precipitation < 5) return 'orange';
    return 'red';
}

/*
  getRainProbabilityColor(probability)

  Antaa ikonille värin sateen todennäköisyyden mukaan:
  - < 30% -> green
  - < 60% -> yellow
  - >= 60% -> red
*/
function getRainProbabilityColor(probability) {
    if (probability === null || probability === undefined) return 'grey';
    if (probability < 30) return 'green';
    if (probability < 60) return 'yellow';
    return 'red';
}
</script>

<style scoped>
/*
  YLEISET TYYLIT
  Tärkein muutos:
  - forecast-korttien tekstit on pakotettu mustiksi,
    jotta ne näkyvät vaaleaa/vihreää/oranssia taustaa vasten.
*/

/* Hakutuloslista */
.city-list {
    max-height: 250px;
    overflow-y: auto;
}

/* Yksittäinen hakutulos */
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

.city-item-title {
    font-weight: 600;
}

.city-item-subtitle {
    opacity: 0.85;
}

/* Koordinaattiteksti */
.city-coords {
    color: #111;
    font-weight: 500;
}

/* Tämän päivän sääkortti */
.current-weather-card {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(76, 175, 80, 0.1));
    border: 1px solid rgba(33, 150, 243, 0.3);
    border-radius: 12px;
}

.current-weather-title {
    color: #111;
}

/* Säätilastoruudut */
.weather-stat {
    text-align: center;
    padding: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.2);
    margin-bottom: 8px;
    color: #111;
}

.weather-stat .stat-value {
    font-size: 1.2em;
    font-weight: 700;
    display: block;
    margin: 4px 0;
    color: #111;
}

.weather-stat .stat-label {
    font-size: 0.8em;
    color: #111;
    font-weight: 500;
}

/* 7 päivän ennustekortit */
.forecast-card {
    background: rgba(76, 175, 80, 0.12);
    border: 1px solid rgba(76, 175, 80, 0.25);
    transition: transform 0.2s ease;
    color: #111;
}

.forecast-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Tämän päivän kortin korostus */
.today-card {
    border-color: rgba(255, 152, 0, 0.6);
    background: rgba(255, 152, 0, 0.18);
}

/* Tänään-badge */
.today-badge {
    background: rgba(255, 152, 0, 0.9);
    color: white;
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 0.7em;
    margin-left: 8px;
    font-weight: 700;
}

/* Päivämäärärivi */
.forecast-date {
    font-weight: 700;
    margin-bottom: 8px;
    color: #111;
}

.forecast-date-icon {
    color: #111;
}

/* Pakotetaan korttien päätekstit mustiksi */
.forecast-main-text {
    color: #111;
    font-weight: 600;
}

/* Lämpötilarivi */
.temp-row {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    color: #111;
}

.temp-max {
    color: #d84315;
    font-weight: 700;
    margin-right: 8px;
}

.temp-min {
    color: #1565c0;
    font-weight: 700;
}

/* Sadesumman rivi */
.rain-row {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    margin-bottom: 4px;
    color: #111;
}

/* Sadetuntien rivi */
.rain-hours-row {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111;
    font-weight: 600;
}

/* Sateen todennäköisyysrivi */
.rain-prob-row {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95em;
    color: #111;
}

.rain-prob {
    margin-left: 4px;
    font-weight: 600;
}
</style>
