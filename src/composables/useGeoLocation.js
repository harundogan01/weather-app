import { onUnmounted, onMounted, ref } from 'vue'

export function useGeoLocation() {
    const coordinates = ref({ latitude: 0, longitude: 0 })
    const isSupported = 'navigator' in window && 'geolocation' in navigator
    let watcher = null
    let resolveReady
    const ready = new Promise((resolve) => {
        resolveReady = resolve
    })
        if (isSupported) {
            watcher = navigator.geolocation.watchPosition(
                position => {
                    coordinates.value.lat = position.coords.latitude
                    coordinates.value.lng = position.coords.longitude
                    resolveReady(coordinates.value)
                },
                () => alert('geolocation permission denied')
            )
        } else {
            alert('navigator.geolocation not supported!')
        }

    onUnmounted(() => {
        if (watcher) navigator.geolocation.clearWatch(watcher)
    })
    return { coordinates, isSupported, ready }
}