// Tämä Pinia-kauppa hallitsee ForecastApp-sovelluksen säätilan.
// Pinia on asennettu projektin riippuvuuksiin pnpm:llä.
import { defineStore } from 'pinia';

export const useWeatherStore = defineStore('weather', {
    state: () => ({
        selectedCity: null,
        weather: null,
        loading: false,
        error: '',
        latestWeatherRequest: 0,
    }),

    actions: {
        setCity(city) {
            this.selectedCity = city;
        },

        async fetchWeather(city) {
            if (!city) return;

            this.loading = true;
            this.error = '';
            this.weather = null;

            const requestId = ++this.latestWeatherRequest;

            try {
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,precipitation_hours&timezone=auto`,
                );

                if (!response.ok) throw new Error('Sään haku epäonnistui');

                const data = await response.json();

                if (requestId !== this.latestWeatherRequest) return;

                const forecast = (data.daily?.time || []).map((date, index) => ({
                    date,
                    temp_max: data.daily.temperature_2m_max?.[index] ?? null,
                    temp_min: data.daily.temperature_2m_min?.[index] ?? null,
                    precipitation_sum: data.daily.precipitation_sum?.[index] ?? null,
                    precipitation_probability_max:
                        data.daily.precipitation_probability_max?.[index] ?? null,
                    precipitation_hours: data.daily.precipitation_hours?.[index] ?? null,
                }));

                this.weather = {
                    place: `${city.name}, ${city.country}`,
                    latitude: city.latitude,
                    longitude: city.longitude,
                    temp_max: forecast[0]?.temp_max ?? null,
                    temp_min: forecast[0]?.temp_min ?? null,
                    precipitation_sum: forecast[0]?.precipitation_sum ?? null,
                    precipitation_probability_max:
                        forecast[0]?.precipitation_probability_max ?? null,
                    precipitation_hours: forecast[0]?.precipitation_hours ?? null,
                    forecast,
                };
            } catch {
                this.error = 'Sään haku epäonnistui';
            } finally {
                this.loading = false;
            }
        },

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
