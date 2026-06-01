// 1. ИЗБОР НА HTML ЕЛЕМЕНТИ
const searchInput = document.querySelector('.search-input input');
const searchButton = document.querySelector('.search-button');

const cityNameEl = document.querySelector('.city-name');
const cityRegionEl = document.querySelector('.city-region');
const tempValueEl = document.querySelector('.temp-value');
const conditionLabelEl = document.querySelector('.condition-label');

const statValues = document.querySelectorAll('.stat-value');
const windEl = statValues[0];
const feelsLikeEl = statValues[1];
const precipitationEl = statValues[2]; 

const detailValues = document.querySelectorAll('.detail-value');
const sunriseEl = detailValues[0];
const sunsetEl = detailValues[1];
const humidityEl = detailValues[2];
const pressureEl = detailValues[3];

const timeValueEl = document.querySelector('.meta-value');

// 2. ВЗЕМАНЕ НА ДАННИ ЗА ВРЕМЕТО
async function getWeather(city) {
    try {
        // СТЪПКА 1: Вземане на координати (на български език - language=bg)
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=bg&format=json`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("Градът не е намерен");
        }

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;

        // СТЪПКА 2: Вземане на времето чрез координатите
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=sunrise,sunset&timezone=auto`;
        
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        // Обновяване на екрана
        updateUI(location, weatherData);

    } catch (error) {
        console.error("Грешка:", error);
        alert("Не успяхме да намерим данни за този град. Моля, проверете изписването.");
    }
}

// 3. ОБНОВЯВАНЕ НА HTML
function updateUI(location, weather) {
    const current = weather.current;
    const daily = weather.daily;

    cityNameEl.textContent = location.name;
    cityRegionEl.textContent = location.country || '';
    tempValueEl.textContent = Math.round(current.temperature_2m);
    
    conditionLabelEl.textContent = getWeatherCondition(current.weather_code);

    windEl.textContent = `${current.wind_speed_10m} км/ч`;
    feelsLikeEl.textContent = `${Math.round(current.apparent_temperature)} °C`;
    precipitationEl.textContent = `${current.precipitation} мм`;

    humidityEl.textContent = `${current.relative_humidity_2m} %`;
    pressureEl.textContent = `${Math.round(current.surface_pressure)} хПа`;

    sunriseEl.textContent = formatTime(daily.sunrise[0]);
    sunsetEl.textContent = formatTime(daily.sunset[0]);
    timeValueEl.textContent = formatTime(current.time);
}

// 4. ПОМОЩНИ ФУНКЦИИ
function getWeatherCondition(code) {
    if (code === 0) return "Ясно небе";
    if (code === 1 || code === 2 || code === 3) return "Променлива облачност";
    if (code === 45 || code === 48) return "Мъгла";
    if (code >= 51 && code <= 55) return "Слаб дъжд / Ръмеж";
    if (code >= 61 && code <= 65) return "Дъжд";
    if (code >= 71 && code <= 75) return "Сняг";
    if (code >= 95) return "Гръмотевична буря";
    return "Неизвестно";
}

function formatTime(isoString) {
    const date = new Date(isoString);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes; 
    return `${hours}:${minutes}`;
}

// 5. СЛУШАТЕЛИ ЗА СЪБИТИЯ (Търсене)
searchButton.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) getWeather(city);
});

searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const city = searchInput.value.trim();
        if (city) getWeather(city);
    }
});

// Зарежда София по подразбиране при отваряне на страницата
getWeather('София');