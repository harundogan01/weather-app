<template>
    <v-card theme="dark" class="card-container">
        <div class="inner-container">
            <div class="col-xs-10 col-sm-8 col-md-5 col-lg-5 col-xs-5 ma-10 justify-center autoselect align-center text-center">
                <v-autocomplete v-model="selectedItem" label="Specific Location" clearable :loading="isLoading"
                    item-title="name" item-value="id" @keydown.enter="getSearchedData($event.target.value)"
                    :search-input.sync="search" :items="search_results" theme="dark" :getSelectedData="getSelectedData"
                    placeholder="Enter the place where you want to access the location information"
                    variant="outlined"></v-autocomplete>
                <v-alert v-if="!selectedItem" type="info" color="blue">
                    Enter the name of the region (for example, New York) where you want to see the weather information
                    and press Enter.
                </v-alert>
            </div>
            <v-card-title
                v-if="(items_one.length > 0 && items_two.length > 0) || (search_results.length > 0 && selectedItem)"
                class="text-center justify-center">
                <p>{{ area !== city ? `${area} , ${city} , ${country}` : `${city} , ${country}` }} Current Weather</p>
            </v-card-title>
            <p class="text-center justify-center"
                v-if="(items_one.length > 0 && items_two.length > 0) || (search_results.length > 0 && selectedItem)">
                Last Update Time: {{ last_update_time }}
            </p>
            <v-tabs centered theme="dark" v-model="tabs"
                v-if="(items_one.length > 0 && items_two.length > 0) || (search_results.length > 0 && selectedItem)">
                <v-tab :value="1">Current Weather</v-tab>
                <v-tab :value="2">Three Day Weather Forecast</v-tab>
            </v-tabs>
            <v-tabs-window v-model="tabs">
                <v-tabs-window-item :value="1">
                    <v-card-text>
                        <v-list class="text-center">
                            <v-item-group class="leftBlock d-inline-block col-xs-6 col-sm-6 col-md-5 col-lg-5 col-xl-6"
                                color="grey">
                                <v-list-item v-for="(item, i) in items_one" :key="i" :value="item">
                                    <template v-slot:prepend>
                                        <v-icon v-if="item.title !== 'Weather Status'" :icon="item.icon"></v-icon>
                                        <v-img v-else :src="item.icon" width="42"></v-img>
                                    </template>
                                    <v-list-item-title v-text="item.title + ' : ' + item.text"></v-list-item-title>
                                </v-list-item>
                            </v-item-group>
                            <v-item-group color="grey"
                                class="centerBlock d-inline-block col-xs-6 col-sm-6 col-md-5 col-lg-5 col-xl-6">
                                <v-list-item v-for="(item, i) in items_two" :key="i" :value="item">
                                    <template v-slot:prepend>
                                        <v-icon :icon="item.icon"></v-icon>
                                    </template>
                                    <v-list-item-title v-text="item.title + ' : ' + item.text"></v-list-item-title>
                                </v-list-item>
                            </v-item-group>
                        </v-list>
                    </v-card-text>
                </v-tabs-window-item>
                <v-tabs-window-item :value="2">
                    <div class="d-flex justify-center align-center text-center">
                        <v-card class="ml-10 mt-10" max-width="800" v-for="(item, i) in forecast" :key="i">
                            <v-list-item two-line>
                                <v-list-item-subtitle>
                                    {{ item.date }}, {{ item.day.condition.text }}
                                </v-list-item-subtitle>
                            </v-list-item>

                            <v-card-text>
                                <v-row align="center">
                                    <v-col class="text-h2" cols="6" title="Average Temperature">
                                        {{ item.day.avgtemp_c }}&deg;C
                                    </v-col>
                                    <v-col cols="6">
                                        <v-img :src="item.day.condition.icon" :alt="item.day.condition.text" width="92">
                                        </v-img>
                                    </v-col>
                                </v-row>
                            </v-card-text>

                            <v-list-item prepend-icon="mdi-send">
                                <v-list-item-subtitle>
                                    {{ item.day.maxwind_kph }} km/h
                                </v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item prepend-icon="mdi-waves-arrow-up">
                                <v-list-item-subtitle title="Average Humidity">
                                    {{ item.day.avghumidity }}%
                                </v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item prepend-icon="mdi-thermometer-minus">
                                <v-list-item-subtitle title="Minimum Temperature">
                                    {{ item.day.mintemp_c }}%
                                </v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item prepend-icon="mdi-thermometer-plus">
                                <v-list-item-subtitle title="Maximum Temperature">
                                    {{ item.day.maxtemp_c }}%
                                </v-list-item-subtitle>
                            </v-list-item>
                        </v-card>
                    </div>
                </v-tabs-window-item>
            </v-tabs-window>
        </div>
    </v-card>
</template>
<script setup>
import moment from 'moment'
import { useGeoLocation } from '../composables/useGeoLocation'
import '@mdi/font/css/materialdesignicons.css'
import { computed, onBeforeMount, watch, ref } from 'vue'
import axios from 'axios'

const { coordinates, ready } = useGeoLocation()
const search = ref(null)
const isLoading = ref(false)
const last_update_time = ref(null)
const area = ref(null)
const weatherImage = ref(null)
const weatherStatus = ref(null)
const city = ref(null)
const country = ref(null)
const items_one = ref([])
const items_two = ref([])
const forecast = ref([])
const search_results = ref([])
const selectedItem = ref(null)
const latAndLonBySearchedLocation = ref(null)
const tabs = ref(null)

onBeforeMount(() => {
    getUserLocation()
})

const getSelectedData = computed(() => {
    const res = search_results.value.filter((val) => val.id === selectedItem.value)
    res.forEach((val) => {
        latAndLonBySearchedLocation.value = val.lat + ',' + val.lon
        getUserLocation(latAndLonBySearchedLocation.value)
    })
})

const getSearchedData = async val => {
    if (!val)
        search_results.value = []
    else {
        isLoading.value = true
        const response = await axios.get(import.meta.env.VITE_BASE_URL + 'search.json', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            params: {
                key: "265fce76a01d4f5696082647252001",
                q: val
            }
        })
        const resp = await response.data
        search_results.value = resp.map((val) => {
            return {
                id: val.id,
                name: val.name,
                region: val.region,
                country: val.country,
                lat: val.lat,
                lon: val.lon
            }
        })
        console.log("SR: " ,search_results.value)
        isLoading.value = false
    }
}

const getUserLocation = async (param) => {
    if (param === null || param === "" || param === undefined) {
        ready.then(async (coords) => {
            try {
                const latitude = coords.lat
                const longitude = coords.lng
                const response = await axios.get(import.meta.env.VITE_BASE_URL + 'forecast.json', {
                    headers: { 'Content-Type': 'application/json' },
                    params: {
                        key: "265fce76a01d4f5696082647252001",
                        q: latitude + ',' + longitude,
                        days: 3
                    }
                });

                const resp = await response.data;

                resp.forecast.forecastday.forEach((val, index) => {
                        forecast.value.push(val);
                });

                items_one.value.push(
                    { title: "Weather Status", text: resp.current.condition.text, icon: resp.current.condition.icon },
                    { title: "Humidity", text: resp.current.humidity, icon: "mdi-waves-arrow-up" },
                    { title: "Latitude", text: resp.location.lat, icon: "mdi-latitude" },
                    { title: "Longitude", text: resp.location.lon, icon: "mdi-longitude" },
                    { title: "Wind Degree", text: resp.current.wind_degree, icon: "mdi-wind-power" },
                    { title: "Pressure in milibars", text: resp.current.pressure_mb, icon: "mdi-car-brake-low-pressure" },
                    { title: "Wind speed per hour(km)", text: resp.current.wind_kph, icon: "mdi-wind-power" },
                    { title: "Gust in kilometer per hour", text: resp.current.gust_kph, icon: "mdi-weather-windy" }
                );

                items_two.value.push(
                    { title: "Temperature in Celsius", text: resp.current.temp_c, icon: "mdi-temperature-celsius" },
                    { title: "Temperature in Fahrenheit", text: resp.current.temp_f, icon: "mdi-temperature-fahrenheit" },
                    { title: "Felt temperature", text: resp.current.feelslike_c, icon: "mdi-temperature-celsius" },
                    { title: "Felt temperature", text: resp.current.feelslike_f, icon: "mdi-temperature-fahrenheit" },
                    { title: "Wind Direction", text: resp.current.wind_degree, icon: "mdi-wind-power-outline" },
                    { title: "Precipitation amount in (mm)", text: resp.current.precip_mm, icon: "mdi-weather-pouring" },
                    { title: "Wind speed per hour(mi)", text: resp.current.wind_mph, icon: "mdi-wind-power" },
                    { title: "Gust in miles per hour", text: resp.current.gust_mph, icon: "mdi-weather-windy" }
                );

                last_update_time.value = moment(resp.current.last_updated).format('DD-MM-YYYY LT');
                area.value = resp.location.name;
                city.value = resp.location.region;
                country.value = resp.location.country;
                weatherImage.value = resp.current.condition.icon;
                weatherStatus.value = resp.current.condition.text;

            } catch (error) {
                console.log('API isteği sırasında hata oluştu:', error);
            }
        })
    }
    else {
        forecast.value = []
        items_one.value = []
        items_two.value = []
        const response = await axios.get(import.meta.env.VITE_BASE_URL + 'forecast.json', {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            params: {
                key: "265fce76a01d4f5696082647252001",
                q: param,
                days: 3
            }
        })
        const resp = await response.data

        resp.forecast.forecastday.forEach((val, index) => {
                        forecast.value.push(val);
                });
                items_one.value.push(
                { title: "Weather Status", text: resp.current.condition.text, icon: resp.current.condition.icon },
                { title: "Humidity", text: resp.current.humidity, icon: "mdi-waves-arrow-up" },
                { title: "Latitude", text: resp.location.lat, icon: "mdi-latitude" },
                { title: "Longitude", text: resp.location.lon, icon: "mdi-longitude" },
                { title: "Wind Degree", text: resp.current.wind_degree, icon: "mdi-wind-power" },
                { title: "Pressure in milibars", text: resp.current.pressure_mb, icon: "mdi-car-brake-low-pressure" },
                { title: "Wind speed per hour(km)", text: resp.current.wind_kph, icon: "mdi-wind-power" },
                { title: "Gust in kilometer per hour", text: resp.current.gust_kph, icon: "mdi-weather-windy" }
            )
            items_two.value.push(
                { title: "Temperature in Celsius", text: resp.current.temp_c, icon: "mdi-temperature-celsius" },
                { title: "Temperature in Fahrenheit", text: resp.current.temp_f, icon: "mdi-temperature-fahrenheit" },
                { title: "Felt temperature", text: resp.current.feelslike_c, icon: "mdi-temperature-celsius" },
                { title: "Felt temperature", text: resp.current.feelslike_f, icon: "mdi-temperature-fahrenheit" },
                { title: "Wind Direction", text: resp.current.wind_degree, icon: "mdi-wind-power-outline" },
                { title: "Precipitation amount in (mm)", text: resp.current.precip_mm, icon: "mdi-weather-pouring" },
                { title: "Wind speed per hour(mi)", text: resp.current.wind_mph, icon: "mdi-wind-power" },
                { title: "Gust in miles per hour", text: resp.current.gust_mph, icon: "mdi-weather-windy" }
            )
            last_update_time.value = moment(resp.current.last_updated).format('DD-MM-YYYY LT')
            area.value = resp.location.name
            city.value = resp.location.region
            country.value = resp.location.country
            weatherImage.value = resp.current.condition.icon
            weatherStatus.value = resp.current.condition.text
    }
}

watch(search, (newVal) => {
  if (newVal === null || newVal === '') {
    search_results.value = []
  }
})
</script>

<style scoped>
.card-container {
    height: 100%;
    position: relative;
    background-color: transparent;
    .inner-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        .autoselect {
            width: 68%;
        }
        :deep(.v-window) {
            .v-window-item:last-child {
                .d-flex {

                }
            }
        }
    }
}
</style>