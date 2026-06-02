// DOM елементи
const searchInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-btn');

const cityNameEl = document.getElementById('city-name');
const cityRegionEl = document.getElementById('city-region');
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

// главна функция за визмане на времето
async function getWeather(city) {
    try {
        // Изчистваме старото търсене от полето
        searchInput.value = '';

        // Намираме координатите. 
        // Използваме encodeURIComponent, за да моеж ако някой град е със интервал или специални символи
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=bg&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        // Проверяваме дали градът е намерен
        if (!geoData.results || geoData.results.length === 0)
    {
            alert(`Градът не бе намерен "${city}". Опитайте отново!`);
            return;
        }

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;

        // Взимаме самото време чрез координатите
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=sunrise,sunset&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        //Рефрешва се страницата
        updateUI(location, weatherData);

    } catch (error) {
        // съобщение за грешка ако нещо не работи
        alert("Възникна техническа грешка: " + error.message);
    }
}

// --- 3. ФУНКЦИЯ ЗА ПРОМЯНА НА ТЕКСТА В HTML ---
function updateUI(location, weather) {
    cityNameEl.textContent = location.name;
    // Ако държавата липсва, показваме празен текст, за да не пише "undefined"
    cityRegionEl.textContent = location.country || ""; 
    temperatureEl.textContent = Math.round(weather.current.temperature_2m);
    
    conditionEl.textContent = getWeatherCondition(weather.current.weather_code);

    windEl.textContent = weather.current.wind_speed_10m + " км/ч";
    feelsLikeEl.textContent = Math.round(weather.current.apparent_temperature) + " °C";
    precipitationEl.textContent = weather.current.precipitation + " мм";

    humidityEl.textContent = weather.current.relative_humidity_2m + " %";
    pressureEl.textContent = Math.round(weather.current.surface_pressure) + " хПа";

    sunriseEl.textContent = formatTime(weather.daily.sunrise[0]);
    sunsetEl.textContent = formatTime(weather.daily.sunset[0]);
    timeEl.textContent = formatTime(weather.current.time);
}

// --- 4. ПОМОЩНИ ФУНКЦИИ ---
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

function formatTime(timeString) {
    // Ако API-то не върне час по някаква причина, връщаме празен текст
    if (!timeString) return "--:--"; 
    
    const date = new Date(timeString);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes;
}

// --- 5. СЪБИТИЯ (EVENTS) ---
// При клик на бутона
searchButton.addEventListener('click', function() {
    const city = searchInput.value.trim();
    if (city !== "") {
        getWeather(city);
    }
});

// При натискане на Enter
searchInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const city = searchInput.value.trim();
        if (city !== "") {
            getWeather(city);
        }
    }
});

// Зареждаме София при първоначално отваряне
getWeather('София');