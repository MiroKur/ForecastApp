<template>
    <v-container class="d-flex align-center justify-center" style="height: 100vh">
        <v-row class="justify-center">
            <v-col cols="12" md="10">
                <v-card class="pa-8" elevation="8" min-height="500">
                    <v-card-title class="text-h3 mb-6 text-center">Yksityiskohdat</v-card-title>

                    <v-row>
                        <v-col cols="12" md="4" class="text-center">
                            <v-img
                                src="https://randomuser.me/api/portraits/men/1.jpg"
                                alt="Developer profile"
                                class="rounded-circle mx-auto"
                                width="200"
                                height="200"
                            ></v-img>
                        </v-col>

                        <v-col cols="12" md="8">
                            <div v-if="creatorData" class="text-left">
                                <h2 class="text-h4 mb-4">
                                    {{ creatorData.firstName }} {{ creatorData.lastName }}
                                </h2>
                                <p class="text-body-1 mb-4">
                                    {{ creatorData.jobTitle }} at {{ creatorData.company }}
                                </p>
                                <p class="text-body-2">
                                    Tämä sääsovellus on tehty SAMK:n frontend-ohjelmointi kurssille.
                                    Sovellus käyttää Vue.js:ää, Vuetify-komponentteja ja Vue
                                    Routeria navigointiin. Sääennusteet ovat tällä hetkellä
                                    staattisia, mutta sovellus on rakennettu laajennettavaksi
                                    todellisilla sää-API:illa.
                                </p>
                            </div>

                            <v-divider class="my-6"></v-divider>

                            <div class="text-center">
                                <v-btn
                                    color="yellow"
                                    size="x-large"
                                    variant="outlined"
                                    @click="goBack"
                                >
                                    STEP IN
                                </v-btn>
                            </div>
                        </v-col>
                    </v-row>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { onBeforeMount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const creatorData = ref({
    firstName: 'Tuntematon',
    lastName: '',
    jobTitle: '',
    company: '',
});

if (route.query.creatorData) {
    try {
        creatorData.value = JSON.parse(route.query.creatorData);
    } catch (err) {
        console.warn('creatorData parsing failed:', err);
    }
}

onBeforeMount(() => {
    console.log('Creator data ennen komponentin renderöintiä:', creatorData.value);
});

onMounted(() => {
    creatorData.value = {
        firstName: creatorData.value.firstName || 'Mirkku',
        lastName: creatorData.value.lastName || 'Korpela',
        jobTitle: creatorData.value.jobTitle || 'Opiskelija',
        company: creatorData.value.company || 'SAMK',
    };
    console.log('Creator data komponentin renderöinnin jälkeen:', creatorData.value);
});
const goBack = () => {
    router.push('/');
};
</script>
