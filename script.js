// --- 1. DOM ELEMENTS SELECTION (CLEANED UP IN A SINGLE OBJECT) ---
const DOM = {
    searchInput: document.getElementById('city-input'),
    searchButton: document.getElementById('search-btn'),
    themeButton: document.getElementById('theme-btn'),
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

// --- 2. MAIN WEATHER FUNCTION ---
async function getWeather(city) {
    try {
        // Clear the input field for the next search
        DOM.searchInput.value = '';

        // Reset the layout visibility before a new search (BUG FIX PART 1)
        DOM.error.style.display = 'none';
        DOM.cityRegion.style.display = 'block';
        DOM.tempBox.style.display = 'flex';
        DOM.conditionBox.style.display = 'flex';

        // Check if the city text length is higher than 9 characters, if so, cut it and add "..."
        let displayCity = city;
        if (city.length > 9) {
            displayCity = city.substring(0, 9) + '...';
        }

        // STEP 1: Fetch geographical coordinates (latitude and longitude)
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=bg&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        // Check if the city results exist in the API database
        if (!geoData.results || geoData.results.length === 0) {
            clearUI(); // Reset all display metrics to prevent old data leaks (BUG FIX PART 2)
            DOM.cityName.textContent = "Грешка";
            DOM.cityRegion.style.display = 'none';
            DOM.tempBox.style.display = 'none';
            DOM.conditionBox.style.display = 'none';

            // Show customized error message with a trimmed city name
            DOM.error.textContent = `Градът "${displayCity}" не бе намерен! Опитайте отново.`;
            DOM.error.style.display = 'block';
            return;
        }

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;

        // STEP 2: Fetch specific weather conditions using coordinates
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=sunrise,sunset&timezone=auto`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        // STEP 3: Pass data to render on the screen
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

// --- 3. UI RENDERING FUNCTIONS ---
function updateUI(location, weather) {
    const code = weather.current.weather_code;

    DOM.cityName.textContent = location.name;
    DOM.cityRegion.textContent = location.country || ""; 
    DOM.temperature.textContent = Math.round(weather.current.temperature_2m);
    
    // Updates the HTML elements with separated emoji and translated text
    DOM.conditionIcon.textContent = getWeatherEmoji(code);
    DOM.condition.textContent = getWeatherText(code);

    // Append standard weather metrics to HTML boxes
    DOM.wind.textContent = weather.current.wind_speed_10m + " км/ч";
    DOM.feelsLike.textContent = Math.round(weather.current.apparent_temperature) + " °C";
    DOM.precipitation.textContent = weather.current.precipitation + " мм";

    DOM.humidity.textContent = weather.current.relative_humidity_2m + " %";
    DOM.pressure.textContent = Math.round(weather.current.surface_pressure) + " хПа";

    // Format long date strings into standard hours and minutes
    DOM.sunrise.textContent = formatTime(weather.daily.sunrise[0]);
    DOM.sunset.textContent = formatTime(weather.daily.sunset[0]);
    DOM.time.textContent = formatTime(weather.current.time);
}

// Resets all display metrics to dashes and clears main weather fields (BUG FIX SOLVED)
// This functions stops old data from visible layout placement during errors
function clearUI() {
    DOM.conditionIcon.textContent = "";
    DOM.condition.textContent = "";
    DOM.wind.textContent = "-- км/ч";
    DOM.feelsLike.textContent = "-- °C";
    DOM.precipitation.textContent = "-- мм";
    DOM.sunrise.textContent = "--:--";
    DOM.sunset.textContent = "--:--";
    DOM.humidity.textContent = "-- %";
    DOM.pressure.textContent = "-- хПа";
    DOM.time.textContent = "--:--";
}

// --- 4. HELPER UTILITIES ---
// Maps the numerical Open-Meteo weather code to beautiful emojis
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

// Maps the numerical Open-Meteo weather code to Bulgarian translated texts
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

// Function to handle empty inputs or spaces safely
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

// --- 5. EVENT LISTENERS ---
// Trigger search action on button click
DOM.searchButton.addEventListener('click', function() {
    handleSearch();
});

// Trigger search action on pressing the Enter key
DOM.searchInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

// Click event for toggling Light/Dark theme smoothly
DOM.themeButton.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        DOM.themeButton.textContent = "☀️ Светъл режим";
    } else {
        DOM.themeButton.textContent = "🌙 Тъмен режим";
    }
});

// Run default search for Sofia when the application opens
getWeather('София');