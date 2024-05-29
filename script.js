
const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");


const API_KEY = "2bcb255bc662c59b6d388e489e4c45b0"; 


const createWeatherCard = (cityName, weatherItem, index) => {
    const temperature = (weatherItem.main.temp - 273.15).toFixed(2); 
    let backgroundStyle = '';

    
    if (temperature > 25) backgroundStyle = 'background-color: rgba(255, 99, 71, 0.5);'; 
    else if (temperature < 10) backgroundStyle = 'background-color: rgba(0, 0, 255, 0.5);';
    else backgroundStyle = 'background-color: rgba(255, 255, 0, 0.5);'; 

    
    if (index === 0) {
        return `<div class="details" style="${backgroundStyle}">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6>Temperature: ${temperature}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                    <h6>Pressure: ${weatherItem.main.pressure} hPa</h6>
                    
                    <p id="prediction">Rain Prediction: <span id="result">Loading...</span></p>
                </div>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
    } 
    
    else {
        return `<li class="card" style="${backgroundStyle}">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}.png" alt="weather-icon">
                    <h6>Temp: ${temperature}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
}


const getWeatherDetails = async (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    try {
        const response = await fetch(WEATHER_API_URL);
        const data = await response.json();

        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                uniqueForecastDays.push(forecastDate);
                return true;  
            }
            return false;
        });

        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        fiveDaysForecast.forEach((weatherItem, index) => {
            const html = createWeatherCard(cityName, weatherItem, index);
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", html);
                
                const currentWeatherData = {
                    humidity: parseFloat(weatherItem.main.humidity) ,
                    min_temp: parseFloat(weatherItem.main.temp_min) - 273.15,
                    wind: parseFloat(weatherItem.wind.speed),
                    max_temp: parseFloat(weatherItem.main.temp_max) - 273.15,
                    pressure: parseFloat(weatherItem.main.pressure),
                    cloud: parseFloat(weatherItem.clouds.all),
                };
                predictRain(currentWeatherData);
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", html);
            }
        });
    } catch (error) {
        alert("An error occurred while fetching the weather forecast!");
    }
}


const getCityCoordinates = async () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") return;
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (!data.length) return alert(`No coordinates found for ${cityName}`);
        const { lat, lon, name } = data[0];
        getWeatherDetails(name, lat, lon);
    } catch (error) {
        alert("An error occurred while fetching the coordinates!");
    }
}

//  get user coordinates
const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        async position => {
            const { latitude, longitude } = position.coords; 
            
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            try {
                const response = await fetch(API_URL);
                const data = await response.json();
                const { name } = data[0];
                getWeatherDetails(name, latitude, longitude);
            } catch (error) {
                alert("An error occurred while fetching the city name!");
            }
        },
        error => { 
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            } else {
                alert("Geolocation request error. Please reset location permission.");
            }
        });
}



const predictRain = async (weatherData) => {
    const API_URL = 'http://127.0.0.1:5000/predict'; 

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(weatherData)
        });

        const data = await response.json();
        const predictionElement = document.getElementById('result');
        predictionElement.textContent = data.prediction;
    } catch (error) {
        console.error('Error predicting rain:', error);
    }
};



locationButton.addEventListener("click", getUserCoordinates);
searchButton.addEventListener("click", getCityCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());