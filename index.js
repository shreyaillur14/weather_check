const weatherForm = document.querySelector(".weatherForm");
const cityInput = document.querySelector(".cityInput");
const card = document.querySelector(".card");
const cityDisplay = document.querySelector(".cityDisplay");
const tempDisplay = document.querySelector(".tempDisplay");
const humidityDisplay = document.querySelector(".humidityDisplay");
const descDisplay = document.querySelector(".descDisplay");
const weatherEmoji = document.querySelector(".weatherEmoji");
const errorDisplay = document.querySelector(".errorDisplay");
const feelsLikeDisplay = document.querySelector(".feelsLikeDisplay");
const windDisplay = document.querySelector(".windDisplay");
const forecastContainer = document.querySelector(".forecast-container");
const forecastCards = document.querySelector(".forecast-cards");
const unitButtons = document.querySelectorAll(".unit-btn");
const loader = document.querySelector(".loader");

// API key (ensure this key is active)
const apiKey = "9d9f09129ed6499c2dd50267206a066b";

// Default unit
let currentUnit = "metric";

// Location cache
let lastLocation = {
    city: "",
    lat: null,
    lon: null
};

// Event listeners
weatherForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const city = cityInput.value.trim();

    if (!city) {
        displayError("Please enter a city");
        return;
    }

    await fetchWeatherData(city);
});

// Unit toggle
unitButtons.forEach(button => {
    button.addEventListener("click", async () => {
        if (!button.classList.contains("active")) {
            unitButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
            currentUnit = button.getAttribute("data-unit");
            
            // Refetch weather with new units if we have a city
            if (lastLocation.city) {
                await fetchWeatherData(lastLocation.city);
            }
        }
    });
});

// Main function to fetch weather data
async function fetchWeatherData(city) {
    // Show loader, hide previous content
    loader.style.display = "flex";
    card.style.display = "none";
    forecastContainer.style.display = "none";
    errorDisplay.style.display = "none";

    try {
        // Get current weather
        const weatherData = await getWeatherData(city);
        lastLocation = {
            city: weatherData.name,
            lat: weatherData.coord.lat,
            lon: weatherData.coord.lon
        };
        
        // Display current weather
        displayWeatherInfo(weatherData);
        
        // Get and display forecast
        const forecastData = await getForecastData(weatherData.coord.lat, weatherData.coord.lon);
        displayForecastInfo(forecastData);
        
        // Hide loader
        loader.style.display = "none";
    } catch (error) {
        console.error(error);
        loader.style.display = "none";
        displayError("Could not fetch weather data. Check city name or API key.");
    }
}

async function getWeatherData(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${currentUnit}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error(`City not found (${response.status})`);
    }

    return await response.json();
}

async function getForecastData(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${currentUnit}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error(`Forecast data not available (${response.status})`);
    }

    return await response.json();
}

function displayWeatherInfo(data) {
    const { 
        name: city, 
        main: { temp, humidity, feels_like }, 
        weather: [{ description, id }],
        wind: { speed }
    } = data;

    // Display weather information
    cityDisplay.textContent = city;
    tempDisplay.textContent = `Temperature: ${temp.toFixed(1)}${currentUnit === 'metric' ? '°C' : '°F'}`;
    feelsLikeDisplay.textContent = `Feels like: ${feels_like.toFixed(1)}${currentUnit === 'metric' ? '°C' : '°F'}`;
    humidityDisplay.textContent = `Humidity: ${humidity}%`;
    windDisplay.textContent = `Wind: ${speed} ${currentUnit === 'metric' ? 'm/s' : 'mph'}`;
    descDisplay.textContent = description;
    weatherEmoji.textContent = getWeatherEmoji(id);

    // Set background based on weather
    setCardBackground(id);

    // Show the card
    errorDisplay.style.display = "none";
    card.style.display = "flex";
}

function displayForecastInfo(data) {
    // Clear previous forecast
    forecastCards.innerHTML = '';
    
    // We only want one forecast per day (not every 3 hours)
    const dailyForecasts = filterDailyForecasts(data.list);
    
    // Generate forecast cards
    dailyForecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const dayName = getDayName(date);
        const temp = forecast.main.temp;
        const description = forecast.weather[0].description;
        const weatherId = forecast.weather[0].id;
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        
        forecastCard.innerHTML = `
            <div class="forecast-date">${dayName}</div>
            <div class="forecast-temp">${temp.toFixed(1)}${currentUnit === 'metric' ? '°C' : '°F'}</div>
            <div class="forecast-emoji">${getWeatherEmoji(weatherId)}</div>
            <div class="forecast-desc">${description}</div>
        `;
        
        forecastCards.appendChild(forecastCard);
    });
    
    // Show forecast container
    forecastContainer.style.display = "block";
}

// Filter to get one forecast per day (noon)
function filterDailyForecasts(forecastList) {
    const dailyForecasts = [];
    const processedDays = new Set();
    
    for (const forecast of forecastList) {
        const date = new Date(forecast.dt * 1000);
        const day = date.getDate();
        
        // Skip current day
        if (date.getDate() === new Date().getDate()) {
            continue;
        }
        
        // If we haven't processed this day yet
        if (!processedDays.has(day)) {
            // Check if there's a forecast around noon
            const hour = date.getHours();
            if (hour >= 11 && hour <= 13) {
                dailyForecasts.push(forecast);
                processedDays.add(day);
            }
        }
        
        // Stop after we have 5 days
        if (dailyForecasts.length >= 5) {
            break;
        }
    }
    
    return dailyForecasts;
}

function getDayName(date) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
}

function getWeatherEmoji(weatherId) {
    if (weatherId >= 200 && weatherId < 300) return "⛈️";
    if (weatherId >= 300 && weatherId < 500) return "🌧️";
    if (weatherId >= 500 && weatherId < 600) return "🌦️";
    if (weatherId >= 600 && weatherId < 700) return "❄️";
    if (weatherId >= 700 && weatherId < 800) return "🌫️";
    if (weatherId === 800) return "☀️";
    if (weatherId > 800) return "☁️";
    return "❓";
}

function setCardBackground(weatherId) {
    // Remove all classes first
    card.classList.remove('clear', 'clouds', 'rain', 'snow', 'thunder', 'mist');
    
    // Add appropriate class based on weather
    if (weatherId === 800) {
        card.classList.add('clear');
    } else if (weatherId > 800) {
        card.classList.add('clouds');
    } else if ((weatherId >= 300 && weatherId < 600)) {
        card.classList.add('rain');
    } else if (weatherId >= 600 && weatherId < 700) {
        card.classList.add('snow');
    } else if (weatherId >= 200 && weatherId < 300) {
        card.classList.add('thunder');
    } else if (weatherId >= 700 && weatherId < 800) {
        card.classList.add('mist');
    }
}

function displayError(message) {
    errorDisplay.textContent = message;
    errorDisplay.style.display = "block";
    card.style.display = "flex";
    forecastContainer.style.display = "none";
}