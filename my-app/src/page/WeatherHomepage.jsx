import React, { useState, useEffect } from "react";
import {
  FiSun, FiCloud, FiCloudRain, FiWind, FiDroplet, FiEye,
  FiThermometer, FiMapPin, FiSearch
} from "react-icons/fi";
import { WiHumidity, WiBarometer } from "react-icons/wi";
import Chart from "./Chart";

const WeatherHomepage = () => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");

  const [currentWeather, setCurrentWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // ============================
  // 1. Load danh sách thành phố
  // ============================
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/cities")
        .then((res) => res.json())
        .then((data) => {
          setCities(data.cities);
          setSelectedCity(data.cities[0]); // chọn city đầu tiên
        });
  }, []);

  // ============================
  // 2. Load current weather theo city
  // ============================
  useEffect(() => {
    if (!selectedCity) return;

    setLoading(true);

    fetch(`http://127.0.0.1:5000/api/current-weather?city=${selectedCity}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success") {
            const w = data.data;
            setCurrentWeather({
              location: w.city_name,
              temperature: w.temp,
              feelsLike: w.feels_like,
              condition: w.weather_type,
              humidity: w.humidity,
              windSpeed: w.wind_speed,
              pressure: w.pressure,
              visibility: w.visibility,
              date: w.actual_date
            });
          }
        })
        .finally(() => setLoading(false));
  }, [selectedCity]);

  if (loading || !currentWeather)
    return <div className="text-white p-10">Loading weather data...</div>;

  // ============================
  // ICON theo loại thời tiết
  // ============================
  const getWeatherIcon = () => {
    const condition = currentWeather.condition.toLowerCase();
    if (condition.includes("rain")) return FiCloudRain;
    if (condition.includes("cloud")) return FiCloud;
    return FiSun;
  };

  const CurrentWeatherIcon = getWeatherIcon();

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
        {/* HEADER */}
        <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FiSun className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">WeatherPro</h1>
            </div>

            {/* Dropdown chọn city */}
            <select
                className="px-4 py-2 bg-white/20 text-white rounded-lg"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
            >
              {cities.map((city, index) => (
                  <option key={index} value={city} className="text-black">{city}</option>
              ))}
            </select>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* CURRENT WEATHER CARD */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">

                {/* Location + Date */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-2 text-white/80">
                    <FiMapPin className="w-5 h-5" />
                    <span className="text-lg font-medium">{currentWeather.location}</span>
                  </div>
                  <div className="text-white/60 text-sm">{currentWeather.date}</div>
                </div>

                {/* Temperature */}
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-6xl text-white">{currentWeather.temperature}°C</div>
                    <div className="text-xl text-white/80">{currentWeather.condition}</div>
                    <div className="text-white/60">Feels like {currentWeather.feelsLike}°C</div>
                  </div>
                  {/* eslint-disable-next-line react-hooks/static-components */}
                  <CurrentWeatherIcon className="w-24 h-24 text-white/80" />
                </div>

                {/* DETAILS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/20">

                  <div className="text-center">
                    <WiHumidity className="w-8 h-8 text-white mx-auto mb-2" />
                    <div className="text-white/60 text-sm">Humidity</div>
                    <div className="text-white font-semibold">{currentWeather.humidity}%</div>
                  </div>

                  <div className="text-center">
                    <FiWind className="w-8 h-8 text-white mx-auto mb-2" />
                    <div className="text-white/60 text-sm">Wind Speed</div>
                    <div className="text-white font-semibold">{currentWeather.windSpeed} m/s</div>
                  </div>

                  <div className="text-center">
                    <WiBarometer className="w-8 h-8 text-white mx-auto mb-2" />
                    <div className="text-white/60 text-sm">Pressure</div>
                    <div className="text-white font-semibold">{currentWeather.pressure} hPa</div>
                  </div>

                  <div className="text-center">
                    <FiEye className="w-8 h-8 text-white mx-auto mb-2" />
                    <div className="text-white/60 text-sm">Visibility</div>
                    <div className="text-white font-semibold">{currentWeather.visibility} km</div>
                  </div>

                </div>
              </div>
            </div>

            {/* SIDEBAR - giữ nguyên UI */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">24-Hour Forecast</h3>
                <div className="text-white/60">No data available</div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Air Quality</h3>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Good</span>
                <p className="text-white/60 mt-4">Air quality is satisfactory.</p>
              </div>
            </div>
          </div>

          {/* CHART */}
          <div className="mt-10">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Weather Metrics</h3>
              <Chart city={selectedCity} />
            </div>
          </div>
        </main>

        {/* FOOTER giữ nguyên */}
        <footer className="bg-white/5 backdrop-blur-md border-t border-white/20 mt-12 px-4 py-8 text-center text-white/60">
          © 2025 WeatherPro
        </footer>
      </div>
  );
};

export default WeatherHomepage;