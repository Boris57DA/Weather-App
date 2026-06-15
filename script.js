// --- 1. DOM ELEMENTS SELECTION (ORGANIZED IN AN OBJECT) ---
const DOM = {
    searchInput: document.getElementById('city-input'),
    searchButton: document.getElementById('search-btn'),
    themeButton: document.getElementById('theme-btn'),
    unitButton: document.getElementById('unit-toggle-btn'), // NEW: Metric toggle selector
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
let currentUnit = 'C'; // Global state to remember selected unit ('C' or 'F')
// Load search history from browser memory, or start fresh empty array []
let searchHistory = JSON.parse(localStorage.getItem('weatherHistory')) || [];

// --- 3. MAIN WEATHER FUNCTION ---
async function getWeather(city) {
    try {
        DOM.searchInput.value = '';

        // Reset display states before firing new fetch calls (BUG FIX)
        DOM.error.style.display = 'none';
        DOM.cityRegion.style.display = 'block';
        DOM.tempBox.style.display = 'flex';
        DOM.conditionBox.style.display = 'flex';

        // Truncate search text display if input exceeds 9 characters
        let displayCity = city;
        if (city.length > 9) {
            displayCity = city.substring(0, 9) + '...';
        }

        // FETCH 1: Retrieve geographical coordinates
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=bg&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            clearUI(); // Empty lower UI layout blocks during validation errors
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

        // FETCH 2: Retrieve full current forecast using valid coordinates
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=sunrise,sunset&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        // Save successfully found city into localStorage array
        addToHistory(location.name);

        // Render data values onto screen
        updateUI(location, weatherData);

    } catch (error) {
        clearUI();
        DOM.cityName.textContent = "Грешка";
        DOM.cityRegion.style.display = 'none';
        DOM.tempBox.style.display = 'none';
        DOM.conditionBox.style.display = 'none';
        
        DOM.error.textContent = "Възникна техническа грешка с връзката!";
        DOM.error.style.display = 'block';
    }
}

// --- 4. UI RENDERING FUNCTIONS ---
function updateUI(location, weather) {
    const code = weather.current.weather_code;

    DOM.cityName.textContent = location.name;
    DOM.cityRegion.textContent = location.country || ""; 
    
    // Core metric temperature variable parsing
    let temp = Math.round(weather.current.temperature_2m);
    let feelsLike = Math.round(weather.current.apparent_temperature);

    // NEW: If global state is Fahrenheit, convert values mathematically
    if (currentUnit === 'F') {
        temp = Math.round(temp * 1.8 + 32);
        feelsLike = Math.round(feelsLike * 1.8 + 32);
    }

    // Populate main temperature readings with dynamically shifting indicators
    DOM.temperature.textContent = temp;
    document.querySelector('.temp-unit').textContent = ` °${currentUnit}`;
    DOM.feelsLike.textContent = `${feelsLike} °${currentUnit}`;

    // Map remaining default elements
    DOM.conditionIcon.textContent = getWeatherEmoji(code);
    DOM.condition.textContent = getWeatherText(code);
    DOM.wind.textContent = weather.current.wind_speed_10m + " км/ч";
    DOM.precipitation.textContent = weather.current.precipitation + " мм";
    DOM.humidity.textContent = weather.current.relative_humidity_2m + " %";
    DOM.pressure.textContent = Math.round(weather.current.surface_pressure) + " хПа";

    DOM.sunrise.textContent = formatTime(weather.daily.sunrise[0]);
    DOM.sunset.textContent = formatTime(weather.daily.sunset[0]);
    DOM.time.textContent = formatTime(weather.current.time);
}

// Empty display items cleanly during system faults (BUG FIX COMPLETED)
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

// --- 5. LOCALSTORAGE LOGIC (NEW AREA) ---
function addToHistory(cityName) {
    // Remove duplicate entry if city was already searched earlier
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== cityName.toLowerCase());
    
    // Add current search target right to the front of the array tracking list
    searchHistory.unshift(cityName);
    
    // Limit array entries to maximum of 5 units to avoid layout clustering
    if (searchHistory.length > 5) {
        searchHistory.pop();
    }
    
    // Commit updating data tracking log onto permanent local memory block
    localStorage.setItem('weatherHistory', JSON.stringify(searchHistory));
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

// NEW: Click event listener for tracking Metric temperature conversion switches
DOM.unitButton.addEventListener('click', function() {
    if (currentUnit === 'C') {
        currentUnit = 'F';
        DOM.unitButton.textContent = "Промени на °C";
    } else {
        currentUnit = 'C';
        DOM.unitButton.textContent = "Промени на °F";
    }
    
    // Re-fire fetch request using currently displayed text selector to trigger immediate conversions
    const currentCity = DOM.cityName.textContent;
    if (currentCity !== "Име на града" && currentCity !== "Грешка") {
        getWeather(currentCity);
    }
});

// Run default initialization call for Sofia city parameters on startup loaded profiles
getWeather('София');