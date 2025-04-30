let searchBox;
let map;
let currentLocationMarker;

async function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map container not found!');
        return;
    }

    try {
        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
        const { Geocoder } = await google.maps.importLibrary("geocoding");
        const { places } = await google.maps.importLibrary("places");


        // Початкова позиція - Київ
        const position = { lat: 50.450001, lng: 30.523333 };

        // Створюємо карту
        map = new Map(mapElement, {
            zoom: 12,
            center: position,
            mapId: 'DEMO_MAP_ID',
            mapTypeControl: true,
            streetViewControl: true
        });

        map.addListener('click', async (event) => {
            const clickedPosition = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            };

            // Оновлюємо позицію маркера
            currentLocationMarker.position = clickedPosition;
            currentLocationMarker.map = map;

            try {
                // Створюємо геокодер
                const geocoder = new google.maps.Geocoder();

                // Отримуємо адресу за координатами
                const response = await geocoder.geocode({ location: clickedPosition });

                let locationInfo = '';
                if (response.results[0]) {
                    // Отримуємо компоненти адреси
                    const addressComponents = response.results[0].address_components;
                    const locality = addressComponents.find(component =>
                        component.types.includes('locality'))?.long_name;
                    const route = addressComponents.find(component =>
                        component.types.includes('route'))?.long_name;
                    const streetNumber = addressComponents.find(component =>
                        component.types.includes('street_number'))?.long_name;

                    if (locality || route) {
                        locationInfo = `
                    <h3>Вибрана локація</h3>
                    <p><strong>Місто:</strong> ${locality || 'Не визначено'}</p>
                    <p><strong>Адреса:</strong> ${route ? `${route}${streetNumber ? `, ${streetNumber}` : ''}` : 'Не визначено'}</p>
                `;
                    } else {
                        locationInfo = `
                    <h3>Вибрана локація</h3>
                    <p><strong>Широта:</strong> ${clickedPosition.lat.toFixed(6)}</p>
                    <p><strong>Довгота:</strong> ${clickedPosition.lng.toFixed(6)}</p>
                `;
                    }
                } else {
                    locationInfo = `
                <h3>Вибрана локація</h3>
                <p><strong>Широта:</strong> ${clickedPosition.lat.toFixed(6)}</p>
                <p><strong>Довгота:</strong> ${clickedPosition.lng.toFixed(6)}</p>
            `;
                }

                // Створюємо та показуємо інфо-вікно
                const infoWindow = new google.maps.InfoWindow({
                    content: `<div style="padding: 10px;">${locationInfo}</div>`
                });

                infoWindow.open(map, currentLocationMarker);
            } catch (error) {
                console.error('Помилка геокодування:', error);
                // У випадку помилки показуємо координати
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                <div style="padding: 10px;">
                    <h3>Вибрана локація</h3>
                    <p><strong>Широта:</strong> ${clickedPosition.lat.toFixed(6)}</p>
                    <p><strong>Довгота:</strong> ${clickedPosition.lng.toFixed(6)}</p>
                </div>
            `
                });
                infoWindow.open(map, currentLocationMarker);
            }
        });

        const locationInput = document.getElementById('location');
        if (locationInput) {
            try {
                // Створюємо автодоповнення
                const autocomplete = new google.maps.places.Autocomplete(locationInput, {
                    types: ['geocode', 'establishment'],
                    fields: ['formatted_address', 'geometry', 'name']
                });


                // Прив'язуємо автодоповнення до карти
                autocomplete.bindTo('bounds', map);

                // Обробник події вибору місця
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();

                    if (!place.geometry || !place.geometry.location) {
                        alert('Місце не знайдено');
                        return;
                    }

                    // Оновлюємо позицію маркера
                    currentLocationMarker.position = place.geometry.location;
                    currentLocationMarker.map = map;

                    // Оновлюємо карту
                    if (place.geometry.viewport) {
                        map.fitBounds(place.geometry.viewport);
                    } else {
                        map.setCenter(place.geometry.location);
                        map.setZoom(17);
                    }

                    // Створюємо та показуємо інфо-вікно
                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                    <div style="padding: 10px;">
                        <h3>${place.name || 'Вибрана локація'}</h3>
                        <p>${place.formatted_address || ''}</p>
                    </div>
                `
                    });

                    infoWindow.open(map, currentLocationMarker);
                });

                // Запобігаємо виряджання форми при натисканні Enter
                locationInput.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                    }
                });

            } catch (error) {
                console.error('Помилка ініціалізації автодоповнення:', error);
            }
        }


        // Створюємо елемент для маркера
        const markerElement = document.createElement('div');
        markerElement.innerHTML = `
            <div style="
                background-color: #4285F4;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,.3);
                cursor: pointer;
                width: 16px;
                height: 16px;
                position: relative;
            ">
                <div style="
                    background-color: rgba(66, 133, 244, 0.2);
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 24px;
                    height: 24px;
                "></div>
            </div>
        `;

        // Створюємо маркер поточної локації (спочатку прихований)
        currentLocationMarker = new AdvancedMarkerElement({
            map: null,
            position: position,
            content: markerElement,
            title: "Ваша локація"
        });

        // Додаємо обробник для кнопки поточної локації
        const locationButton = document.getElementById('get_current_location');
        if (locationButton) {
            locationButton.addEventListener('click', getCurrentLocation);
        } else {
            console.error('Location button not found');
        }

    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const currentPosition = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                // Створюємо новий елемент для маркера з пульсацією
                const markerElement = document.createElement('div');
                markerElement.innerHTML = `
                    <div style="position: relative;">
                        <div style="
                            background-color: #4285F4;
                            border-radius: 50%;
                            border: 2px solid white;
                            box-shadow: 0 2px 6px rgba(0,0,0,.3);
                            cursor: pointer;
                            width: 16px;
                            height: 16px;
                            position: relative;
                            z-index: 1;
                        "></div>
                        <div style="
                            position: absolute;
                            top: -4px;
                            left: -4px;
                            right: -4px;
                            bottom: -4px;
                            border-radius: 50%;
                            background: #4285F4;
                            opacity: 0.4;
                            animation: pulse 2s infinite;
                        "></div>
                    </div>
                `;

                // Додаємо стиль анімації, якщо його ще немає
                if (!document.getElementById('pulse-animation')) {
                    const style = document.createElement('style');
                    style.id = 'pulse-animation';
                    style.textContent = `
                        @keyframes pulse {
                            0% { transform: scale(1); opacity: 0.4; }
                            70% { transform: scale(3); opacity: 0; }
                            100% { transform: scale(1); opacity: 0; }
                        }
                    `;
                    document.head.appendChild(style);
                }

                // Оновлюємо маркер з новим контентом
                currentLocationMarker.content = markerElement;
                currentLocationMarker.position = currentPosition;
                currentLocationMarker.map = map;

                // Центруємо карту
                map.panTo(currentPosition);
                map.setZoom(15);

                // Показуємо інфо-вікно
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding: 10px;">
                            <h3>Ваша локація</h3>
                            <p><strong>Широта:</strong> ${position.coords.latitude.toFixed(6)}</p>
                            <p><strong>Довгота:</strong> ${position.coords.longitude.toFixed(6)}</p>
                            <p><strong>Точність:</strong> ${position.coords.accuracy.toFixed(1)} метрів</p>
                        </div>
                    `
                });

                infoWindow.open(map, currentLocationMarker);
            },
            (error) => {
                let errorMessage;
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Користувач відмовив у доступі до геолокації.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Інформація про місцезнаходження недоступна.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Час очікування запиту минув.";
                        break;
                    default:
                        errorMessage = "Сталася невідома помилка.";
                }
                alert(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        alert("Геолокація не підтримується вашим браузером.");
    }
}

function redirectToWeather() {
    if (!currentLocationMarker || !currentLocationMarker.position) {
        alert('Спочатку виберіть локацію на карті!');
        return;
    }

    const position = currentLocationMarker.position;

    // Використовуємо метод toJSON() для отримання широти й довготи
    const coordinates = position.toJSON();

    window.location.href = `../view_weather.html`;
}

window.addEventListener('load', () => {
    if (window.google && window.google.maps) {
        initMap();
    } else {
        window.initMap = initMap;
    }
});