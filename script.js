// --- 1. DOM ELEMENTS SELECTION (ORGANIZED IN A SINGLE OBJECT) ---
const DOM = {
    searchInput: document.getElementById('city-input'),
    searchButton: document.getElementById('search-btn'),
    themeButton: document.getElementById('theme-btn'),
    unitButton: document.getElementById('unit-toggle-btn'),
    historyContainer: document.getElementById('history-container'),
    geoButton: document.getElementById('geo-btn'), // NEW: Location request trigger selector
    cityName: document.getElementById('city-name'),
    cityRegion: document.getElementById('city-region'),
    error: document.getElementById('error-message'),
    tempBox: document.getElementById('temp-box'),
    conditionBox: document.getElementById('condition-box'),
    conditionIcon: document.getElementById('condition-icon'),
    temperature: document.getElementById('temperature'),
    condition: document.getElementById('condition'),
    wind: document.getElementById('wind'),
    feelsLike: document.getElementById('feels-like'),
    precipitation: document.getElementById('precipitation'),
    sunrise: document.getElementById('sunrise'),
    sunset: document.getElementById('sunset'),
    humidity: document.getElementById('humidity'),
    pressure: document.getElementById('pressure'),
    time: document.getElementById('local-time')
};

// --- 2. GLOBAL STATES ---
let currentUnit = 'C'; 
let searchHistory = JSON.parse(localStorage.getItem('weatherHistory')) || [];

// Cache variables to hold the raw Celsius values from the last successful fetch
let cachedTemp = null;
let cachedFeelsLike = null;

// --- 3. MAIN WEATHER FUNCTIONS ---
async function getWeather(city) {
    try {
        DOM.searchInput.value = '';

        DOM.error.style.display = 'none';
        DOM.cityRegion.style.display = 'block';
        DOM.tempBox.style.display = 'flex';
        DOM.conditionBox.style.display = 'flex';

        let displayCity = city;
        if (city.length > 9) {
            displayCity = city.substring(0, 9) + '...';
        }

        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=bg&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            clearUI();
            DOM.cityName.textContent = "Грешка";
            DOM.cityRegion.style.display = 'none';
            DOM.tempBox.style.display = 'none';
            DOM.conditionBox.style.display = 'none';

            DOM.error.textContent = `Градът "${displayCity}" не бе намерен! Опитайте отново.`;
            DOM.error.style.display = 'block';
            return;
        }

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=sunrise,sunset&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        addToHistory(location.name);

        cachedTemp = Math.round(weatherData.current.temperature_2m);
        cachedFeelsLike = Math.round(weatherData.current.apparent_temperature);

        updateUI(location.name, location.country || "", weatherData);

    } catch (error) {
        console.error(error); 
        clearUI();
        DOM.cityName.textContent = "Грешка";
        DOM.cityRegion.style.display = 'none';
        DOM.tempBox.style.display = 'none';
        DOM.conditionBox.style.display = 'none';
        
        DOM.error.textContent = "Възникна техническа грешка с връзката!";
        DOM.error.style.display = 'block';
    }
}

async function getWeatherByCoordinates(lat, lon) {
    try {
        DOM.error.style.display = 'none';
        DOM.cityRegion.style.display = 'block';
        DOM.tempBox.style.display = 'flex';
        DOM.conditionBox.style.display = 'flex';

        let resolvedCityName = "Моята локация";
        
        try {
            const reverseGeoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=bg`;
            const reverseGeoResponse = await fetch(reverseGeoUrl);
            const reverseGeoData = await reverseGeoResponse.json();
            resolvedCityName = reverseGeoData.city || reverseGeoData.locality || reverseGeoData.principalSubdivision || "Моята локация";
        } catch (e) {
            console.log("Reverse geocoding network blocked.");
        }

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=sunrise,sunset&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        cachedTemp = Math.round(weatherData.current.temperature_2m);
        cachedFeelsLike = Math.round(weatherData.current.apparent_temperature);

        updateUI(resolvedCityName, "Текущо местоположение", weatherData);

    } catch (error) {
        console.error(error);
        getWeather('София');
    }
}

// --- 4. UI RENDERING FUNCTIONS ---
function updateUI(cityName, cityRegion, weatherData) {
    const code = weatherData.current.weather_code;

    DOM.cityName.textContent = cityName;
    DOM.cityRegion.textContent = cityRegion; 
    
    renderTemperaturesOnly();

    DOM.conditionIcon.textContent = getWeatherEmoji(code);
    DOM.condition.textContent = getWeatherText(code);
    DOM.wind.textContent = weatherData.current.wind_speed_10m + " км/ч";
    DOM.precipitation.textContent = weatherData.current.precipitation + " мм";
    DOM.humidity.textContent = weatherData.current.relative_humidity_2m + " %";
    DOM.pressure.textContent = Math.round(weatherData.current.surface_pressure) + " хПа";

    DOM.sunrise.textContent = formatTime(weatherData.daily.sunrise[0]);
    DOM.sunset.textContent = formatTime(weatherData.daily.sunset[0]);
    DOM.time.textContent = formatTime(weatherData.current.time);
}

function renderTemperaturesOnly() {
    if (cachedTemp === null || cachedFeelsLike === null) return;

    let tempToDisplay = cachedTemp;
    let feelsToDisplay = cachedFeelsLike;

    if (currentUnit === 'F') {
        tempToDisplay = Math.round(cachedTemp * 1.8 + 32);
        feelsToDisplay = Math.round(cachedFeelsLike * 1.8 + 32);
    }

    DOM.temperature.textContent = tempToDisplay;
    document.querySelector('.temp-unit').textContent = ` °${currentUnit}`;
    DOM.feelsLike.textContent = `${feelsToDisplay} °${currentUnit}`;
}

function clearUI() {
    DOM.conditionIcon.textContent = "";
    DOM.condition.textContent = "";
    DOM.wind.textContent = "-- км/ч";
    DOM.feelsLike.textContent = "-- °" + currentUnit;
    DOM.precipitation.textContent = "-- мм";
    DOM.sunrise.textContent = "--:--";
    DOM.sunset.textContent = "--:--";
    DOM.humidity.textContent = "-- %";
    DOM.pressure.textContent = "-- хПа";
    DOM.time.textContent = "--:--";
}

// --- 5. LOCALSTORAGE HISTORY LOGIC ---
function addToHistory(cityName) {
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== cityName.toLowerCase());
    searchHistory.unshift(cityName);
    if (searchHistory.length > 5) { searchHistory.pop(); }
    localStorage.setItem('weatherHistory', JSON.stringify(searchHistory));
    renderHistory();
}

function renderHistory() {
    DOM.historyContainer.innerHTML = '';
    searchHistory.forEach(city => {
        const badge = document.createElement('button');
        badge.textContent = city;
        badge.style.cssText = `
            background-color: var(--card-alt);
            color: var(--ink);
            border: 1px solid var(--border);
            padding: 6px 12px;
            border-radius: 12px;
            cursor: pointer;
            font-family: inherit;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s ease;
        `;
        badge.addEventListener('mouseover', () => badge.style.borderColor = 'var(--ink)');
        badge.addEventListener('mouseout', () => badge.style.borderColor = 'var(--border)');
        badge.addEventListener('click', () => {
            getWeather(city);
        });
        DOM.historyContainer.appendChild(badge);
    });
}

// --- 6. HELPER UTILITIES ---
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
    if (minutes < 10) { minutes = "0" + minutes; }
    return hours + ":" + minutes;
}

function handleSearch() {
    const city = DOM.searchInput.value.trim();
    if (city === "") {
        clearUI();
        DOM.cityName.textContent = "Грешка";
        DOM.cityRegion.style.display = 'none';
        DOM.tempBox.style.display = 'none';
        DOM.conditionBox.style.display = 'none';
        
        DOM.error.textContent = "Невалиден вход! Моля, въведете град.";
        DOM.error.style.display = 'block';
    } else {
        getWeather(city);
    }
}

// --- 7. EVENT LISTENERS ---
DOM.searchButton.addEventListener('click', function() {
    handleSearch();
});

DOM.searchInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

DOM.themeButton.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        DOM.themeButton.textContent = "☀️ Светъл режим";
    } else {
        DOM.themeButton.textContent = "🌙 Тъмен режим";
    }
});

DOM.unitButton.addEventListener('click', function() {
    if (currentUnit === 'C') {
        currentUnit = 'F';
        DOM.unitButton.textContent = "Промени на °C";
    } else {
        currentUnit = 'C';
        DOM.unitButton.textContent = "Промени на °F";
    }
    renderTemperaturesOnly();
});

// NEW: Clicking location badge forces immediate on-demand GPS coordinates query execution
DOM.geoButton.addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherByCoordinates(lat, lon);
            },
            () => {
                DOM.error.textContent = "Достъпът до локация е забранен от браузъра!";
                DOM.error.style.display = 'block';
            }
        );
    } else {
        DOM.error.textContent = "Браузърът ви не поддържа геолокация!";
        DOM.error.style.display = 'block';
    }
});

// --- 8. SYSTEM INITIALIZATION ---
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeatherByCoordinates(lat, lon);
        },
        () => {
            console.log("Geolocation blocked/failed. Using Sofia.");
            getWeather('София');
        }
    );
} else {
    getWeather('София');
}
renderHistory();