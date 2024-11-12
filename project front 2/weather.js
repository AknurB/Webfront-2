const API_KEY = '28ee701ef3d42073001e607175318574';

let unit = 'metric'; 

document.getElementById('search').addEventListener('input', async function (event) {
    const city = event.target.value;
    if (city.length > 2) {
      const weather = await fetchWeather(city);
      displayCurrentWeather(weather);
      const forecast = await fetchForecast(city);
      displayForecast(forecast);
    }
  });
  
  document.getElementById('unit-toggle').addEventListener('change', function () {
    unit = document.getElementById('unit-toggle').value;
    const city = document.getElementById('search').value;
    if (city) {
      fetchWeather(city).then(displayCurrentWeather);
      fetchForecast(city).then(displayForecast);
    }
  });
  
  document.getElementById('location-button').addEventListener('click', function () {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const weather = await fetchWeatherByCoords(latitude, longitude);
        displayCurrentWeather(weather);
        const forecast = await fetchForecastByCoords(latitude, longitude);
        displayForecast(forecast);
      });
    }
  });
  
  async function fetchWeather(city) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${API_KEY}`);
    return response.json();
  }
  
  async function fetchWeatherByCoords(lat, lon) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`);
    return response.json();
  }
  
  async function fetchForecast(city) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${API_KEY}`);
    const data = await response.json();
    return data.list.filter((item, index) => index % 8 === 0);
  }
  
  async function fetchForecastByCoords(lat, lon) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_KEY}`);
    const data = await response.json();
    return data.list.filter((item, index) => index % 8 === 0);
  }
  
  function displayCurrentWeather(weather) {
    const currentWeather = document.getElementById('current-weather');
    currentWeather.innerHTML = `
      <h2>${weather.name}</h2>
      <p>Temperature: ${weather.main.temp}°${unit === 'metric' ? 'C' : 'F'}</p>
      <p>Humidity: ${weather.main.humidity}%</p>
      <p>Wind Speed: ${weather.wind.speed} ${unit === 'metric' ? 'm/s' : 'mph'}</p>
      <p>Conditions: ${weather.weather[0].description}</p>
      <img src="https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png" alt="${weather.weather[0].description}">
    `;
  }
  
  function displayForecast(forecast) {
    const forecastSection = document.getElementById('forecast');
    forecastSection.innerHTML = '<h2>5-Day Forecast</h2>';
    forecast.forEach(day => {
      forecastSection.innerHTML += `
        <div class="forecast-item">
          <p class="forecast-date">${new Date(day.dt_txt).toLocaleDateString()}</p>
          <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
          <p class="forecast-temp">High: ${day.main.temp_max}°${unit === 'metric' ? 'C' : 'F'}</p>
          <p class="forecast-temp">Low: ${day.main.temp_min}°${unit === 'metric' ? 'C' : 'F'}</p>
          <p class="forecast-condition">${day.weather[0].description}</p>
        </div>
      `;
    });
}
