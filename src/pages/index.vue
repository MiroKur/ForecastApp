<template>
    <!--
        Sadevahti-pääsivu

        Kommentit jakavat näkymän selkeisiin osiin, jotta koodista näkee nopeasti,
        mikä osa vastaa mistäkin käyttöliittymän kohdasta.
    -->

    <v-container class="py-12">
        <!-- ============================= -->
        <!-- HERO-OSIO: Sovelluksen nimi ja esittelyteksti -->
        <!-- ============================= -->
        <v-row justify="center" class="mb-10">
            <v-col cols="12" md="8" class="text-center">
                <v-sheet color="primary" rounded="lg" class="pa-10 text-white elevation-3">
                    <div class="text-h2 font-weight-bold mb-4">Sadevahti</div>

                    <div class="text-subtitle-1">
                        Säänavigaattori, joka tietää että tulet kastumaan. Hae paikkakuntakohtaiset
                        sade- ja säätiedot helposti ja nopeasti. Valmistaudu sateeseen ennen kuin se
                        yllättää sinut!
                    </div>
                </v-sheet>
            </v-col>
        </v-row>

        <!-- ============================= -->
        <!-- NAVIGOINTIOSIO: Kortit sovelluksen pääsivuille -->
        <!-- ============================= -->
        <v-row justify="center" align="stretch" class="g-6">
            <!-- ============================= -->
            <!-- SÄÄENNUSTE-KORTTI -->
            <!-- Käyttäjä siirtyy tästä sääennustesivulle -->
            <!-- ============================= -->
            <v-col cols="12" md="5">
                <v-card elevation="4" rounded="lg" class="pa-6 h-100">
                    <!-- Kortin yläosa: kuvake, otsikko ja lyhyt kuvaus -->
                    <v-row align="center" class="mb-4">
                        <v-col cols="auto">
                            <v-icon size="48" color="primary">mdi-weather-partly-cloudy</v-icon>
                        </v-col>

                        <v-col>
                            <div class="text-h5 font-weight-bold">Sääennuste</div>

                            <div class="text-body-2 text-secondary">
                                Hae paikkakuntakohtainen sää ja 7 päivän sadetiedot.
                            </div>
                        </v-col>
                    </v-row>

                    <!-- Kortin sisältöteksti -->
                    <v-card-text class="mb-6">
                        Tutustu päivän lämpötiloihin, sateen todennäköisyyteen ja tulevan viikon
                        ennusteeseen.
                    </v-card-text>

                    <!-- Kortin toimintopainike -->
                    <v-card-actions>
                        <v-btn color="primary" variant="elevated" to="/forecast" class="mx-auto">
                            Siirry sääennusteeseen
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <!-- ============================= -->
            <!-- LISÄTIEDOT-KORTTI -->
            <!-- Käyttäjä siirtyy tästä lisätietosivulle -->
            <!-- ============================= -->
            <v-col cols="12" md="5">
                <v-card elevation="4" rounded="lg" class="pa-6 h-100">
                    <!-- Kortin yläosa: kuvake, otsikko ja lyhyt kuvaus -->
                    <v-row align="center" class="mb-4">
                        <v-col cols="auto">
                            <v-icon size="48" color="secondary">mdi-information-outline</v-icon>
                        </v-col>

                        <v-col>
                            <div class="text-h5 font-weight-bold">Lisätiedot</div>

                            <div class="text-body-2 text-secondary">
                                Lue sovelluksesta, sen toiminnasta ja käyttövinkeistä.
                            </div>
                        </v-col>
                    </v-row>

                    <!-- Kortin sisältöteksti -->
                    <v-card-text class="mb-6">
                        Tämä sovellus tarjoaa sade- sekä säätietojen hakemisen käyttäjille. Katso
                        käyttöohjeet ja lisätiedot klikkaamalla alla olevaa painiketta.
                    </v-card-text>

                    <!-- Kortin toimintopainike -->
                    <v-card-actions>
                        <v-btn
                            color="secondary"
                            variant="elevated"
                            class="mx-auto"
                            @click="goToDetails"
                        >
                            Näytä lisätiedot
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
// =============================
// IMPORTIT
// =============================
// useRouter tuodaan Vue Routerista, jotta voidaan navigoida sivulta toiselle koodin avulla.
import { useRouter } from 'vue-router';

// =============================
// ROUTERIN KÄYTTÖÖNOTTO
// =============================
// router-muuttujan avulla voidaan siirtää käyttäjä ohjelmallisesti toiseen näkymään.
const router = useRouter();

// =============================
// NAVIGOINTIFUNKTIO
// =============================
// Funktio vie käyttäjän Details-nimiselle reitille, kun lisätiedot-painiketta painetaan.
const goToDetails = () => {
    router.push({ name: 'Details' });
};
</script>
