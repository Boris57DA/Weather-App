// --- 1. DOM ELEMENTS SELECTION ---
const DOM = {
    searchInput: document.getElementById('city-input'),
    searchButton: document.getElementById('search-btn'),
    themeButton: document.getElementById('theme-btn'),
    unitButton: document.getElementById('unit-toggle-btn'),
    historyContainer: document.getElementById('history-container'),
    geoButton: document.getElementById('geo-btn'),
    hourlyContainer: document.getElementById('hourly-container'), // NEW
    dailyContainer: document.getElementById('daily-container'),   // NEW
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

// Master memory tracking object storage cache to trigger conversions cleanly
let weatherCache = null;

// --- 3. MAIN WEATHER FUNCTIONS ---
async function getWeather(city) {
    try {
        DOM.searchInput.value = '';
        DOM.error.style.display = 'none';
        DOM.cityRegion.style.display = 'block';
        DOM.tempBox.style.display = 'flex';
        DOM.conditionBox.style.display = 'flex';

        let displayCity = city;
        if (city.length > 9) { displayCity = city.substring(0, 9) + '...'; }

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
        
        // REFACTORED URL: Appended deep extraction params for hourly metrics and 5-day daily forecasts logs
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        addToHistory(location.name);

        weatherCache = {
            cityName: location.name,
            cityRegion: location.country || "",
            data: weatherData
        };

        updateUI();

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

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        weatherCache = {
            cityName: resolvedCityName,
            cityRegion: "Текущо местоположение",
            data: weatherData
        };

        updateUI();

    } catch (error) {
        console.error(error);
        getWeather('София');
    }
}

// --- 4. UI RENDERING FUNCTIONS ---
function updateUI() {
    if (!weatherCache) return;

    const weatherData = weatherCache.data;
    const code = weatherData.current.weather_code;

    DOM.cityName.textContent = weatherCache.cityName;
    DOM.cityRegion.textContent = weatherCache.cityRegion; 

    DOM.conditionIcon.textContent = getWeatherEmoji(code);
    DOM.condition.textContent = getWeatherText(code);
    DOM.wind.textContent = weatherData.current.wind_speed_10m + " км/ч";
    DOM.precipitation.textContent = weatherData.current.precipitation + " мм";
    DOM.humidity.textContent = weatherData.current.relative_humidity_2m + " %";
    DOM.pressure.textContent = Math.round(weatherData.current.surface_pressure) + " хПа";

    DOM.sunrise.textContent = formatTime(weatherData.daily.sunrise[0]);
    DOM.sunset.textContent = formatTime(weatherData.daily.sunset[0]);
    DOM.time.textContent = formatTime(weatherData.current.time);

    // Call modular rendering macros synchronously
    renderTemperaturesOnly();
    renderHourlyForecast(weatherData.hourly);
    renderDailyForecast(weatherData.daily);
}

function renderTemperaturesOnly() {
    if (!weatherCache) return;
    const current = weatherCache.data.current;

    let temp = Math.round(current.temperature_2m);
    let feelsLike = Math.round(current.apparent_temperature);

    if (currentUnit === 'F') {
        temp = Math.round(temp * 1.8 + 32);
        feelsLike = Math.round(feelsLike * 1.8 + 32);
    }

    DOM.temperature.textContent = temp;
    document.querySelector('.temp-unit').textContent = ` °${currentUnit}`;
    DOM.feelsLike.textContent = `${feelsLike} °${currentUnit}`;
}

// NEW: Generates 24 horizontal hourly forecast card badges dynamically
function renderHourlyForecast(hourlyData) {
    DOM.hourlyContainer.innerHTML = '';
    
    // Parse out current localized hour slot index
    const currentHourIndex = new Date().getHours();
    
    // Slice data loops for the next 24 chronological hours sequence
    for (let i = currentHourIndex; i < currentHourIndex + 24; i++) {
        if (!hourlyData.time[i]) break;

        const timeLabel = formatTime(hourlyData.time[i]);
        let rawTemp = Math.round(hourlyData.temperature_2m[i]);
        const statusCode = hourlyData.weather_code[i];

        if (currentUnit === 'F') { rawTemp = Math.round(rawTemp * 1.8 + 32); }

        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.innerHTML = `
            <p class="hourly-time">${timeLabel}</p>
            <span class="hourly-icon">${getWeatherEmoji(statusCode)}</span>
            <p class="hourly-temp">${rawTemp}°</p>
        `;
        DOM.hourlyContainer.appendChild(card);
    }
}

// NEW: Generates rows mapping out the upcoming 5-day layout trends sequentially
function renderDailyForecast(dailyData) {
    DOM.dailyContainer.innerHTML = '';

    // Loop through indexes 1 to 5 to fetch the subsequent days ahead cleanly (skipping index 0 which is today)
    for (let i = 1; i <= 5; i++) {
        if (!dailyData.time[i]) break;

        const rawDate = new Date(dailyData.time[i]);
        const dayLabel = rawDate.toLocaleDateString('bg-BG', { weekday: 'long' });
        const capitalizedDay = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);

        let maxTemp = Math.round(dailyData.temperature_2m_max[i]);
        let minTemp = Math.round(dailyData.temperature_2m_min[i]);
        const statusCode = dailyData.weather_code[i];

        if (currentUnit === 'F') {
            maxTemp = Math.round(maxTemp * 1.8 + 32);
            minTemp = Math.round(minTemp * 1.8 + 32);
        }

        const row = document.createElement('div');
        row.className = 'daily-row';
        row.innerHTML = `
            <p class="daily-date">${capitalizedDay}</p>
            <div class="daily-condition-box">
                <span class="daily-row-icon">${getWeatherEmoji(statusCode)}</span>
                <span class="daily-row-text">${getWeatherText(statusCode)}</span>
            </div>
            <p class="daily-temp-range">${maxTemp}° / ${minTemp}°</p>
        `;
        DOM.dailyContainer.appendChild(row);
    }
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
    DOM.hourlyContainer.innerHTML = '';
    DOM.dailyContainer.innerHTML = '';
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
            background-color: var(--card-alt); color: var(--ink); border: 1px solid var(--border);
            padding: 6px 12px; border-radius: 12px; cursor: pointer; font-family: inherit;
            font-size: 12px; font-weight: 500; transition: all 0.2s ease;
        `;
        badge.addEventListener('mouseover', () => badge.style.borderColor = 'var(--ink)');
        badge.addEventListener('mouseout', () => badge.style.borderColor = 'var(--border)');
        badge.addEventListener('click', () => getWeather(city));
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

// Clean status summaries mapper
function getWeatherText(code) {
    if (code === 0) return "Ясно небе";
    if (code === 1) return "Предимно ясно";
    if (code === 2) return "Частична облачност";
    if (code === 3) return "Облачно";
    if (code === 45 || code === 48) return "Мъгла";
    if (code >= 51 && code <= 55) return "Ръмеж";
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
DOM.searchButton.addEventListener('click', handleSearch);
DOM.searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });

DOM.themeButton.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    DOM.themeButton.textContent = document.body.classList.contains('dark-mode') ? "☀️ Светъл режим" : "🌙 Тъмен режим";
});

DOM.unitButton.addEventListener('click', function() {
    if (currentUnit === 'C') {
        currentUnit = 'F';
        DOM.unitButton.textContent = "Промени на °C";
    } else {
        currentUnit = 'C';
        DOM.unitButton.textContent = "Промени на °F";
    }
    updateUI(); // Refreshes everything natively from master object memory scopes
});

DOM.geoButton.addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => getWeatherByCoordinates(pos.coords.latitude, pos.coords.longitude),
            () => { DOM.error.textContent = "Достъпът до локация е забранен!"; DOM.error.style.display = 'block'; }
        );
    }
});

// --- 8. SYSTEM INITIALIZATION ---
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (pos) => getWeatherByCoordinates(pos.coords.latitude, pos.coords.longitude),
        () => { console.log("Geolocation failed. Using Sofia."); getWeather('София'); }
    );
} else {
    getWeather('София');
}
renderHistory();