import { defineStore } from 'pinia';

export const useWeatherStore = defineStore('weather', {
    state: () => ({
        searchPhrase: '',
        searchResults: [],
        selectedCity: null,
        weather: null,
        loading: false,
        error: '',
    }),
    actions: {
        setSearchPhrase(value) {
            this.searchPhrase = value;
        },
        setSearchResults(results) {
            this.searchResults = results;
        },
        setSelectedCity(city) {
            this.selectedCity = city;
        },
        setWeather(weatherData) {
            this.weather = weatherData;
        },
        setLoading(isLoading) {
            this.loading = isLoading;
        },
        setError(message) {
            this.error = message;
        },
        resetSearch() {
            this.searchResults = [];
            this.searchPhrase = '';
        },
        resetForecast() {
            this.weather = null;
            this.selectedCity = null;
        },
    },
});
