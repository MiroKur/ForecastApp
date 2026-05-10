<template>
    <!--
      Lisätiedot-sivu projektin tehtävänannon mukaisesti.
      Tämä sivu kertoo sovelluksen tekijästä, kuvauksen, käyttöohjeen ja lisätiedot.
    -->
    <v-container class="py-8">
        <v-row justify="center">
            <v-col cols="12" md="10">
                <v-card elevation="6" class="pa-6">
                    <!-- Sivun otsikko -->
                    <v-card-title class="text-h3 text-center mb-6"> Lisätiedot </v-card-title>

                    <v-card-text>
                        <!-- Tekijätiedot -->
                        <section class="mb-8">
                            <h2 class="text-h5 mb-3">Tietoja sovelluksen tekijästä</h2>
                            <p class="mb-3">
                                Sovelluksen on kehittänyt <strong>Miro</strong> osana
                                <em>ForecastApp</em>-projektia. Tämä sivu on tarkoitettu
                                esittelemään projektin taustaa, kehitystyötä ja käytettävyyttä.
                            </p>
                            <p>
                                Tekijän rooli: frontend-kehitys, Vue 3, Vuetify ja
                                REST-API-integraatiot. Projektissa harjoitellaan käyttöliittymän
                                rakentamista reaaliaikaisella säädatalle.
                            </p>
                        </section>

                        <!-- Sovelluskuvaus -->
                        <section class="mb-8">
                            <h2 class="text-h5 mb-3">Sovelluksen kuvaus</h2>
                            <p class="mb-3">
                                ForecastApp on kevyt sääennusteiden hakusovellus, joka hakee
                                paikkakuntakohtaiset tiedot Open-Meteo-geokoodaus- ja sää-API:ista.
                            </p>
                            <p>
                                Sovelluksen tavoitteena on näyttää käyttäjälle: 1) valitun
                                paikkakunnan perustiedot, 2) nykyisen päivän sää, 3) 7 päivän
                                sadetiedot ja sade-ennusteet.
                            </p>
                        </section>

                        <!-- Käyttöohjeet -->
                        <section class="mb-8">
                            <h2 class="text-h5 mb-3">Käyttöohjeet</h2>
                            <ol class="ps-4">
                                <li class="mb-2">Kirjoita hakukenttään haluttu paikkakunta.</li>
                                <li class="mb-2">Valitse hakutuloksista oikea kaupunki.</li>
                                <li class="mb-2">
                                    Sovellus hakee valitun paikkakunnan säädatan ja näyttää nykyisen
                                    päivän säätilan sekä 7 päivän ennusteen.
                                </li>
                                <li>
                                    Voit palata takaisin etusivulle painamalla
                                    "Takaisin"-painiketta.
                                </li>
                            </ol>
                        </section>

                        <!-- Lisätiedot ja linkit -->
                        <section class="mb-6">
                            <h2 class="text-h5 mb-3">Lisätiedot</h2>
                            <p class="mb-3">
                                Sovellus on rakennettu Vue 3:lla ja Vuetifyllä. Reititys hoidetaan
                                Vue Routerilla.
                            </p>
                            <p>
                                Jos haluat lisätä omia tietojasi, vaihda yllä olevat tekijä- ja
                                sovelluskuvausosat omaan nimeesi ja projektikuvaustasi.
                            </p>
                        </section>

                        <section>
                            <h2 class="text-h5 mb-3">Tärkeitä linkkejä</h2>
                            <ul class="ps-4">
                                <li class="mb-2"><strong>Vue 3:</strong> https://vuejs.org/</li>
                                <li class="mb-2">
                                    <strong>Vuetify:</strong> https://next.vuetifyjs.com/
                                </li>
                                <li><strong>Open-Meteo API:</strong> https://open-meteo.com/</li>
                            </ul>
                        </section>
                    </v-card-text>

                    <v-card-actions class="justify-center mt-6">
                        <!-- Takaisin-painike palauttaa käyttäjän etusivulle -->
                        <v-btn color="primary" @click="goBack"> Takaisin </v-btn>

                        <!-- Painike siirtymään suoraan sääennustesivulle -->
                        <v-btn color="secondary" variant="outlined" @click="goForecast">
                            Näytä sääennuste
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router';

// Reititin, jota käytetään navigointiin takaisin etusivulle.
const router = useRouter();

// Palauttaa käyttäjän pääsivulle.
function goBack() {
    router.push({ name: 'Home' });
}

// Navigoi suoraan Forecast-sivulle.
function goForecast() {
    router.push({ name: 'Forecast' });
}
</script>
