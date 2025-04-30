document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lon = urlParams.get('lon');

    if (lat && lon) {
        try {
            const weatherService = new WeatherService();
            const weatherData = await weatherService.getWeather(lat, lon);
            showWeatherInfo(weatherData);
        } catch (error) {
            console.error('Помилка:', error);
            alert(`Помилка отримання погоди: ${error.message}`);
        }
    } else {
        alert('Координати не вказані!');
    }
});


class WeatherService {
    constructor() {
        this.apiKey = 'your_api_key';
        this.baseUrl = 'http://api.weatherapi.com/v1';
    }

    async getWeather(lat, lon) {
        try {
            const url = `${this.baseUrl}/current.json?key=${this.apiKey}&q=${lat},${lon}&aqi=no&lang=uk`;
            console.log('Запит до API:', url);

            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP помилка! статус: ${response.status}, повідомлення: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            console.log('Отримані дані:', data);

            return {
                location: {
                    name: data.location.name,
                    region: data.location.region,
                    country: data.location.country,
                    localtime: data.location.localtime
                },
                weather: {
                    temperature: data.current.temp_c,
                    feels_like: data.current.feelslike_c,
                    humidity: data.current.humidity,
                    wind_speed: data.current.wind_kph,
                    wind_direction: data.current.wind_dir,
                    pressure: data.current.pressure_mb,
                    description: data.current.condition.text,
                    icon: data.current.condition.icon,
                    uv: data.current.uv,
                    visibility: data.current.vis_km
                }
            };
        } catch (error) {
            console.error('Детальна помилка отримання погоди:', error);
            throw error;
        }
    }

}

function showWeatherInfo(weatherData) {
    const weatherContainer = document.querySelector('.weather-container');

    const weatherHtml = `
        <div class="weather-info-container">
            <div class="location-info">
                <h2>${weatherData.location.name}</h2>
                <p>${weatherData.location.region}, ${weatherData.location.country}</p>
                <p>Місцевий час: ${weatherData.location.localtime}</p>
            </div>
            <div class="current-weather">
                <div class="weather-main">
                    <img src="${weatherData.weather.icon}" alt="Погодні умови">
                    <div class="temperature-block">
                        <p class="temperature">${weatherData.weather.temperature}°C</p>
                        <p class="description">${weatherData.weather.description}</p>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="detail-item">
                        <span class="label">Відчувається як:</span>
                        <span class="value">${weatherData.weather.feels_like}°C</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Вологість:</span>
                        <span class="value">${weatherData.weather.humidity}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Вітер:</span>
                        <span class="value">${weatherData.weather.wind_speed} км/год ${weatherData.weather.wind_direction}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Тиск:</span>
                        <span class="value">${weatherData.weather.pressure} мбар</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">UV індекс:</span>
                        <span class="value">${weatherData.weather.uv}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Видимість:</span>
                        <span class="value">${weatherData.weather.visibility} км</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    weatherContainer.innerHTML = weatherHtml;
}
