<template>
    <v-container class="d-flex align-center justify-center" style="height: 100vh">
        <v-row class="justify-center">
            <v-col cols="12" md="5" class="pa-2">
                <v-card class="text-center pa-6" elevation="4" height="300">
                    <v-card-title class="text-h4 mb-2">
                        <v-icon size="48" class="mb-2" color="primary">mdi-weather-cloudy</v-icon>
                        <br />
                        Sääennuste
                    </v-card-title>

                    <v-card-subtitle class="text-h6 mb-4">
                        Katso tämänhetkinen sää ja ennusteet
                    </v-card-subtitle>

                    <v-card-actions class="justify-center">
                        <v-btn
                            color="primary"
                            size="large"
                            variant="elevated"
                            to="/forecast"
                            prepend-icon="mdi-weather-partly-cloudy"
                        >
                            Näytä ennuste
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <v-col cols="12" md="5" class="pa-2">
                <v-card class="text-center pa-6" elevation="4" height="300">
                    <v-card-title class="text-h4 mb-2">
                        <v-icon size="48" class="mb-2" color="secondary">mdi-chart-line</v-icon>
                        <br />
                        Yksityiskohdat
                    </v-card-title>

                    <v-card-subtitle class="text-h6 mb-4">
                        Tarkastele yksityiskohtaisia sääanalyysejä
                    </v-card-subtitle>

                    <v-card-actions class="justify-center">
                        <v-btn
                            color="secondary"
                            size="large"
                            variant="elevated"
                            prepend-icon="mdi-chart-bar"
                            @click="goToDetailsWithProps"
                        >
                            Näytä yksityiskohdat
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();

const creator = {
    firstName: 'Miro',
    lastName: 'Korpela',
    jobTitle: 'Opiskelija',
    company: 'SAMK',
};

const goToDetailsWithProps = () => {
    router.push({
        name: 'Details',
        query: { creatorData: JSON.stringify(creator) },
    });
};
</script>
