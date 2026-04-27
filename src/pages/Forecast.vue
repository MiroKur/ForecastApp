<template>
    <v-container class="d-flex h-100 flex-column align-center justify-center">
        <div class="top-dot"></div>

        <h1 class="text-h4 text-center">Paikkakunta</h1>
        <!-- Näytetään merkintä pääkaupungista kun valittu (v-show) -->
        <div v-show="city === 'Helsinki'" class="capital-badge">Pääkaupunki</div>

        <v-btn color="success" class="mt-6 mb-2" rounded="lg" @click="setCity('Tornio')">
            ASETA PAIKKAKUNTA TORNIOKSI
        </v-btn>

        <div class="mt-2">{{ city }}</div>

        <v-divider class="my-4 w-100 border-opacity-100" color="success"></v-divider>

        <!-- Input ja lisää-painike (keskitetty) -->
        <v-text-field
            v-model="newCity"
            class="add-input"
            placeholder="Paikkakunta"
            hide-details
            density="comfortable"
        />

        <v-btn color="success" class="mt-2" rounded="lg" :disabled="!newCity" @click="addCity">
            {{ buttonText }}
        </v-btn>

        <div class="mt-2 text-center">
            Paikkakunta listalla yhteensä {{ cities.length }} kappaletta!
        </div>

        <!-- Lista lisätyistä kaupungeista -->
        <div v-if="addedCities.length" class="added-wrapper mt-2 text-center">
            <div class="added-title">Lisätyt paikkakunnat (viimeisimmät):</div>
            <v-list class="added-list">
                <v-list-item v-for="(ac, ai) in addedCities" :key="ai" class="added-item">
                    <v-list-item-title class="text-center">{{ ac }}</v-list-item-title>
                </v-list-item>
            </v-list>
        </div>

        <!-- Scrollattava lista kaikista kaupungeista; näyttää viisi kerrallaan visuaalisesti -->
        <v-list class="city-list mt-4">
            <v-list-item
                v-for="(c, index) in cities"
                :key="index"
                class="city-item"
                @click="setCity(c)"
            >
                <v-list-item-title class="text-center">{{ c }}</v-list-item-title>
                <!-- Näytetään erityismerkintä pääkaupungista (v-if) -->
                <v-list-item-subtitle v-if="c === 'Helsinki'">Pääkaupunki</v-list-item-subtitle>
                <!-- Kotikaupunki-merkintä Kuopiolle -->
                <v-list-item-subtitle v-if="c === 'Kuopio'">Kotikaupunki</v-list-item-subtitle>
            </v-list-item>
        </v-list>
    </v-container>
</template>

<script setup>
import { ref } from 'vue';

const city = ref('Helsinki');
const newCity = ref('');
const addedCities = ref([]);
const buttonText = ref('LISÄÄ');

const cities = ref([
    'Helsinki',
    'Espoo',
    'Vantaa',
    'Tampere',
    'Turku',
    'Oulu',
    'Jyväskylä',
    'Lahti',
    'Kuopio',
    'Pori',
    'Lappeenranta',
    'Kotka',
    'Joensuu',
    'Kokkola',
    'Seinäjoki',
    'Mikkeli',
    'Salo',
    'Porvoo',
    'Rauma',
    'Hyvinkää',
    'Kajaani',
    'Kemi',
    'Keuruu',
    'Sastamala',
    'Raisio',
    'Nurmijärvi',
    'Riihimäki',
    'Varkaus',
    'Kangasala',
    'Kerava',
    'Iisalmi',
]);

function setCity(newCity) {
    console.log('Syötteenä saatu cityName:', newCity);
    console.log('Paikkakuntaa asetetaan...');
    city.value = newCity;
    console.log('Paikkakunta asetettu:', city.value);
}

function addCity() {
    if (!newCity.value) return;
    cities.value.push(newCity.value);
    addedCities.value.unshift(newCity.value); // viimeisin etusijalle
    console.log('Lisättiin paikkakunta:', newCity.value);
    console.log('Lisättiin paikkakunta, nyt yhteensä:', cities.value.length);
    newCity.value = '';
    // tyhjennetään nappiteksti hetkeksi (vaikutus UI:ssa)
    buttonText.value = '';
    setTimeout(() => (buttonText.value = 'LISÄÄ'), 600);
}
</script>

<style scoped>
.top-dot {
    width: 6px;
    height: 6px;
    background: #ff4b4b;
    border-radius: 50%;
    margin-bottom: 10px;
}

.city-list {
    background: transparent;
    width: 360px; /* fixed width similar to screenshot */
    max-width: 90vw;
    border: 1px solid rgba(76, 175, 80, 0.4); /* subtle green border around container */
    padding: 8px;
    max-height: 220px; /* show roughly 5 items, then scroll */
    overflow-y: auto;
}

.city-item {
    border: 1px solid rgba(76, 175, 80, 0.6);
    margin: 6px 0;
    border-radius: 4px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.02); /* almost transparent */
}

.city-item:hover {
    cursor: pointer;
    background: rgba(255, 255, 255, 0.03);
}

/* Scrollbar styling (WebKit + Firefox) */
.city-list::-webkit-scrollbar {
    width: 12px;
}

.city-list::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.02);
}

.city-list::-webkit-scrollbar-thumb {
    background: #4caf50; /* same as success color */
    border-radius: 8px;
    border: 3px solid rgba(0, 0, 0, 0); /* creates padding effect */
    background-clip: padding-box;
}

.city-list {
    scrollbar-width: thin;
    scrollbar-color: #4caf50 rgba(255, 255, 255, 0.02);
}

.add-input {
    width: 320px;
    max-width: 90vw;
    margin: 0 auto;
}

.city-item .v-list-item-title {
    width: 100%;
    display: block;
    text-align: center;
}
</style>
