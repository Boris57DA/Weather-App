// --- 1. DOM ELEMENTS SELECTION ---
const searchInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-btn');
const themeButton = document.getElementById('theme-btn'); 

const cityNameEl = document.getElementById('city-name');
const cityRegionEl = document.getElementById('city-region');
const errorEl = document.getElementById('error-message');

const tempBox = document.getElementById('temp-box');
const conditionBox = document.getElementById('condition-box');

// Selected the new dedicated element for the weather emoji
const conditionIconEl = document.getElementById('condition-icon');
const temperatureEl = document.getElementById('temperature');
const conditionEl = document.getElementById('condition');

const windEl = document.getElementById('wind');
const feelsLikeEl = document.getElementById('feels-like');
const precipitationEl = document.getElementById('precipitation');

const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const humidityEl = document.getElementById('humidity');
const pressureEl = document.getElementById('pressure');
const timeEl = document.getElementById('local-time');

// --- 2. MAIN WEATHER FUNCTION ---
async function getWeather(city) {
    try {
        searchInput.value = '';

        errorEl.style.display = 'none';
        cityRegionEl.style.display = 'block';
        tempBox.style.display = 'flex';
        conditionBox.style.display = 'flex';

        let displayCity = city;
        if (city.length > 9) {
            displayCity = city.substring(0, 9) + '...';
        }

        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=bg&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            clearUI(); 
            cityNameEl.textContent = "Грешка";
            cityRegionEl.style.display = 'none';
            tempBox.style.display = 'none';
            conditionBox.style.display = 'none';

            errorEl.textContent = `Градът "${displayCity}" не бе намерен! Опитайте отново.`;
            errorEl.style.display = 'block';
            return;
        }

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=sunrise,sunset&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        updateUI(location, weatherData);

    } catch (error) {
        clearUI();
        cityNameEl.textContent = "Грешка";
        cityRegionEl.style.display = 'none';
        tempBox.style.display = 'none';
        conditionBox.style.display = 'none';
        
        errorEl.textContent = "Възникна technical грешка с връзката!";
        errorEl.style.display = 'block';
    }
}

// --- 3. UI RENDERING FUNCTIONS ---
function updateUI(location, weather) {
    const code = weather.current.weather_code;

    cityNameEl.textContent = location.name;
    cityRegionEl.textContent = location.country || ""; 
    temperatureEl.textContent = Math.round(weather.current.temperature_2m);
    
    // Updates the HTML elements with separated emoji and translated text
    conditionIconEl.textContent = getWeatherEmoji(code);
    conditionEl.textContent = getWeatherText(code);

    windEl.textContent = weather.current.wind_speed_10m + " км/ч";
    feelsLikeEl.textContent = Math.round(weather.current.apparent_temperature) + " °C";
    precipitationEl.textContent = weather.current.precipitation + " мм";

    humidityEl.textContent = weather.current.relative_humidity_2m + " %";
    pressureEl.textContent = Math.round(weather.current.surface_pressure) + " хПа";

    sunriseEl.textContent = formatTime(weather.daily.sunrise[0]);
    sunsetEl.textContent = formatTime(weather.daily.sunset[0]);
    timeEl.textContent = formatTime(weather.current.time);
}

function clearUI() {
    windEl.textContent = "-- км/ч";
    feelsLikeEl.textContent = "-- °C";
    precipitationEl.textContent = "-- мм";
    sunriseEl.textContent = "--:--";
    sunsetEl.textContent = "--:--";
    humidityEl.textContent = "-- %";
    pressureEl.textContent = "-- хПа";
    timeEl.textContent = "--:--";
}

// --- 4. HELPER UTILITIES ---
// Helper utility function that handles only the emojis
function getWeatherEmoji(code) {
    if (code === 0) return "☀️";
    if (code === 1) return "🌤️";
    if (code === 2) return "⛅";
    if (code === 3) return "☁️";
    if (code === 45 || code === 48) return "🌫️";
    if (code >= 51 && code <= 55) return "🌧️";
    if (code >= 61 && code <= 65) return "🌧️";
    if (code >= 71 && code <= 75) return "❄️";
    if (code >= 95) return "⛈️";
    return "❓";
}

// Helper utility function that handles only the translated texts
function getWeatherText(code) {
    if (code === 0) return "Ясно небе";
    if (code === 1) return "Преобладаващо ясно";
    if (code === 2) return "Променлива облачност";
    if (code === 3) return "Значителна облачност";
    if (code === 45 || code === 48) return "Мъгла";
    if (code >= 51 && code <= 55) return "Слаб дъжд / Ръмеж";
    if (code >= 61 && code <= 65) return "Дъжд";
    if (code >= 71 && code <= 75) return "Сняг";
    if (code >= 95) return "Гръмотевична буря";
    return "Неизвестно";
}

function formatTime(timeString) {
    if (!timeString) return "--:--"; 
    
    const date = new Date(timeString);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes;
}

function handleSearch() {
    const city = searchInput.value.trim();
    
    if (city === "") {
        clearUI();
        cityNameEl.textContent = "Грешка";
        cityRegionEl.style.display = 'none';
        tempBox.style.display = 'none';
        conditionBox.style.display = 'none';
        
        errorEl.textContent = "Невалиден вход! Моля, въведете град.";
        errorEl.style.display = 'block';
    } else {
        getWeather(city);
    }
}

// --- 5. EVENT LISTENERS ---
searchButton.addEventListener('click', function() {
    handleSearch();
});

searchInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

themeButton.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        themeButton.textContent = "☀️ Светъл режим";
    } else {
        themeButton.textContent = "🌙 Тъмен режим";
    }
});

getWeather('София');