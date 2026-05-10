// =============================
// PINIA-STOREN MÄÄRITYS
// =============================
// defineStore-funktiolla luodaan sovelluksen yhteinen weather-store,
// jossa säilytetään valittu kaupunki, säädata ja haun tila.
import { defineStore } from 'pinia';

export const useWeatherStore = defineStore('weather', {
    // =============================
    // STATE
    // =============================
    // State sisältää sääsovelluksen yhteiset muuttujat,
    // joita eri komponentit voivat käyttää.
    state: () => ({
        // Käyttäjän valitsema kaupunki
        selectedCity: null,

        // API:sta haettu säädata
        weather: null,

        // Kertoo, onko säädatan haku parhaillaan käynnissä
        loading: false,

        // Virheviesti näytetään käyttäjälle, jos säädatan haku epäonnistuu
        error: '',

        // Tunniste uusimmalle säähaulle.
        // Tätä käytetään estämään vanhan haun tuloksia ylikirjoittamasta uudempaa hakua.
        latestWeatherRequest: 0,
    }),

    // =============================
    // ACTIONS
    // =============================
    // Actions sisältää funktiot, joilla muutetaan storea
    // ja haetaan säädataa API:sta.
    actions: {
        // =============================
        // KAUPUNGIN ASETTAMINEN
        // =============================
        // Tallentaa käyttäjän valitseman kaupungin storeen.
        setCity(city) {
            this.selectedCity = city;
        },

        // =============================
        // SÄÄDATAN HAKEMINEN
        // =============================
        // Hakee valitun kaupungin sääennusteen Open-Meteo API:sta.
        async fetchWeather(city) {
            // Jos kaupunkia ei ole annettu, hakua ei tehdä.
            if (!city) return;

            // Aloitetaan lataustila ja tyhjennetään vanhat virheet sekä säädata.
            this.loading = true;
            this.error = '';
            this.weather = null;

            // Jokainen haku saa oman tunnisteen.
            // Näin voidaan tarkistaa, onko vastaus vielä ajankohtainen.
            const requestId = ++this.latestWeatherRequest;

            try {
                // =============================
                // API-KUTSU
                // =============================
                // Haetaan 7 päivän sääennuste kaupungin koordinaattien perusteella.
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,precipitation_hours&timezone=auto`,
                );

                // Jos palvelin palauttaa virheen, siirrytään catch-lohkoon.
                if (!response.ok) {
                    throw new Error('Sään haku epäonnistui');
                }

                const data = await response.json();

                // =============================
                // VANHAN HAKUTULOKSEN ESTÄMINEN
                // =============================
                // Jos käyttäjä on ehtinyt tehdä uuden haun ennen tämän valmistumista,
                // tätä vanhaa vastausta ei enää käytetä.
                if (requestId !== this.latestWeatherRequest) return;

                // =============================
                // ENNUSTEDATAN MUOTOILU
                // =============================
                // Muutetaan API:n palauttamat taulukot helpommin käytettävään muotoon.
                // Jokaiselle päivälle luodaan oma olio.
                const forecast = (data.daily?.time || []).map((date, index) => ({
                    date,
                    temp_max: data.daily.temperature_2m_max?.[index] ?? null,
                    temp_min: data.daily.temperature_2m_min?.[index] ?? null,
                    precipitation_sum: data.daily.precipitation_sum?.[index] ?? null,
                    precipitation_probability_max:
                        data.daily.precipitation_probability_max?.[index] ?? null,
                    precipitation_hours: data.daily.precipitation_hours?.[index] ?? null,
                }));

                // =============================
                // SÄÄDATAN TALLENTAMINEN STOREEN
                // =============================
                // Tallennetaan tämän päivän tiedot sekä koko ennustelista.
                this.weather = {
                    place: `${city.name}, ${city.country}`,
                    latitude: city.latitude,
                    longitude: city.longitude,

                    // Tämän päivän sääarvot
                    temp_max: forecast[0]?.temp_max ?? null,
                    temp_min: forecast[0]?.temp_min ?? null,
                    precipitation_sum: forecast[0]?.precipitation_sum ?? null,
                    precipitation_probability_max:
                        forecast[0]?.precipitation_probability_max ?? null,
                    precipitation_hours: forecast[0]?.precipitation_hours ?? null,

                    // Koko ennuste usealle päivälle
                    forecast,
                };
            } catch {
                // =============================
                // VIRHEENKÄSITTELY
                // =============================
                // Jos API-kutsu epäonnistuu, tallennetaan virheviesti storeen.
                this.error = 'Sään haku epäonnistui';
            } finally {
                // =============================
                // LATAUSTILAN LOPETTAMINEN
                // =============================
                // Lataustila lopetetaan aina, onnistui haku tai ei.
                this.loading = false;
            }
        },

        // =============================
        // OLETUSKAUPUNGIN LATAAMINEN
        // =============================
        // Asettaa oletuskaupungiksi Lontoon ja hakee sen säädatan.
        async loadDefaultLondon() {
            const london = {
                id: 'london',
                name: 'London',
                country: 'United Kingdom',
                latitude: 51.5085,
                longitude: -0.1257,
            };

            this.setCity(london);
            await this.fetchWeather(london);
        },
    },
});
