// import React, { useState, useEffect } from "react";
// import { FiSun, FiCloud, FiCloudRain, FiWind, FiDroplet, FiEye, FiThermometer, FiMapPin, FiSearch, FiNavigation } from "react-icons/fi";
// import { WiHumidity, WiBarometer, WiStrongWind } from "react-icons/wi";
// import Chart from "./Chart";

// const WeatherHomepage = () => {
//   const [currentWeather, setCurrentWeather] = useState({
//     location: "New York, NY",
//     temperature: 72,
//     condition: "Partly Cloudy",
//     humidity: 65,
//     windSpeed: 12,
//     pressure: 30.12,
//     visibility: 10,
//     uvIndex: 6,
//     feelsLike: 75
//   });

//   const [searchQuery, setSearchQuery] = useState("");
//   const [isSearching, setIsSearching] = useState(false);

//   const weeklyForecast = [
//     { day: "Today", high: 75, low: 62, condition: "Partly Cloudy", icon: FiCloud },
//     { day: "Tomorrow", high: 78, low: 65, condition: "Sunny", icon: FiSun },
//     { day: "Wednesday", high: 73, low: 59, condition: "Rainy", icon: FiCloudRain },
//     { day: "Thursday", high: 70, low: 58, condition: "Cloudy", icon: FiCloud },
//     { day: "Friday", high: 76, low: 63, condition: "Sunny", icon: FiSun },
//     { day: "Saturday", high: 74, low: 61, condition: "Partly Cloudy", icon: FiCloud },
//     { day: "Sunday", high: 72, low: 60, condition: "Rainy", icon: FiCloudRain }
//   ];

//   const hourlyForecast = [
//     // { time: "12 PM", temp: 72, condition: "Partly Cloudy", icon: FiCloud },
//     // { time: "1 PM", temp: 74, condition: "Sunny", icon: FiSun },
//     // { time: "2 PM", temp: 76, condition: "Sunny", icon: FiSun },
//     // { time: "3 PM", temp: 75, condition: "Partly Cloudy", icon: FiCloud },
//     // { time: "4 PM", temp: 73, condition: "Cloudy", icon: FiCloud },
//     // { time: "5 PM", temp: 71, condition: "Cloudy", icon: FiCloud }
//   ];

//   const handleSearch = (e) => {
//     e.preventDefault();
//     if (searchQuery.trim()) {
//       setIsSearching(true);
//       // Simulate API call
//       setTimeout(() => {
//         setIsSearching(false);
//         setSearchQuery("");
//       }, 1000);
//     }
//   };

//   const getWeatherIcon = (condition) => {
//     switch (condition.toLowerCase()) {
//       case "sunny":
//         return FiSun;
//       case "partly cloudy":
//         return FiCloud;
//       case "cloudy":
//         return FiCloud;
//       case "rainy":
//         return FiCloudRain;
//       default:
//         return FiSun;
//     }
//   };

//   const CurrentWeatherIcon = getWeatherIcon(currentWeather.condition);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
//       {/* Header */}
//       <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center space-x-2">
//               <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
//                 <FiSun className="w-6 h-6 text-white" />
//               </div>
//               <h1 className="text-2xl font-bold text-white">WeatherPro</h1>
//             </div>
            
//             {/* Search Bar */}
//             <form onSubmit={handleSearch} className="flex items-center space-x-2">
//               <div className="relative">
//                 <input
//                   type="text"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   placeholder="Search for a city..."
//                   className="pl-10 pr-4 py-2 w-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
//                 />
//                 <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
//               </div>
//               <button
//                 type="submit"
//                 disabled={isSearching}
//                 className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/20 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
//               >
//                 {isSearching ? "Searching..." : "Search"}
//               </button>
//             </form>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Current Weather - Large Card */}
//           <div className="lg:col-span-2">
//             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
//               <div className="flex items-center justify-between mb-6">
//                 <div className="flex items-center space-x-2 text-white/80">
//                   <FiMapPin className="w-5 h-5" />
//                   <span className="text-lg font-medium">{currentWeather.location}</span>
//                 </div>
//                 <div className="text-white/60 text-sm">
//                   {new Date().toLocaleDateString("en-US", { 
//                     weekday: "long", 
//                     year: "numeric", 
//                     month: "long", 
//                     day: "numeric" 
//                   })}
//                 </div>
//               </div>
              
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-6xl font-light text-white mb-2">
//                     {currentWeather.temperature}°F
//                   </div>
//                   <div className="text-xl text-white/80 mb-1">{currentWeather.condition}</div>
//                   <div className="text-white/60">Feels like {currentWeather.feelsLike}°F</div>
//                 </div>
//                 <div className="text-white/80">
//                   <CurrentWeatherIcon className="w-24 h-24" />
//                 </div>
//               </div>

//               {/* Weather Details Grid */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/20">
//                 <div className="text-center">
//                   <WiHumidity className="w-8 h-8 text-white/70 mx-auto mb-2" />
//                   <div className="text-white/60 text-sm">Humidity</div>
//                   <div className="text-white font-semibold">{currentWeather.humidity}%</div>
//                 </div>
//                 <div className="text-center">
//                   <FiWind className="w-8 h-8 text-white/70 mx-auto mb-2" />
//                   <div className="text-white/60 text-sm">Wind Speed</div>
//                   <div className="text-white font-semibold">{currentWeather.windSpeed} mph</div>
//                 </div>
//                 <div className="text-center">
//                   <WiBarometer className="w-8 h-8 text-white/70 mx-auto mb-2" />
//                   <div className="text-white/60 text-sm">Pressure</div>
//                   <div className="text-white font-semibold">{currentWeather.pressure} in</div>
//                 </div>
//                 <div className="text-center">
//                   <FiEye className="w-8 h-8 text-white/70 mx-auto mb-2" />
//                   <div className="text-white/60 text-sm">Visibility</div>
//                   <div className="text-white font-semibold">{currentWeather.visibility} mi</div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Sidebar */}
//           <div className="space-y-6">
//             {/* Hourly Forecast */}
//             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
//               <h3 className="text-lg font-semibold text-white mb-4">24-Hour Forecast</h3>
//               <div className="space-y-3">
//                 {hourlyForecast.map((hour, index) => {
//                   const HourIcon = hour.icon;
//                   return (
//                     <div key={index} className="flex items-center justify-between py-2">
//                       <span className="text-white/80 text-sm font-medium">{hour.time}</span>
//                       <div className="flex items-center space-x-2">
//                         <HourIcon className="w-4 h-4 text-white/70" />
//                         <span className="text-white font-semibold">{hour.temp}°</span>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Air Quality */}
//             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
//               <h3 className="text-lg font-semibold text-white mb-4">Air Quality</h3>
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <span className="text-white/80">AQI</span>
//                   <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">Good</span>
//                 </div>
//                 <div className="w-full bg-white/20 rounded-full h-2">
//                   <div className="bg-green-400 h-2 rounded-full" style={{width: "25%"}}></div>
//                 </div>
//                 <div className="text-white/60 text-sm">Air quality is satisfactory for most people.</div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Weekly Forecast */}
//         <div className="mt-8">
//           <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
//             <h3 className="text-lg font-semibold text-white mb-6">7-Day Forecast</h3>
//             <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
//               {weeklyForecast.map((day, index) => {
//                 const DayIcon = day.icon;
//                 return (
//                   <div key={index} className="text-center p-4 bg-white/5 rounded-xl border border-white/10">
//                     <div className="text-white/80 font-medium mb-2">{day.day}</div>
//                     <DayIcon className="w-8 h-8 text-white/70 mx-auto mb-3" />
//                     <div className="text-white font-semibold mb-1">{day.high}°</div>
//                     <div className="text-white/60 text-sm">{day.low}°</div>
//                     <div className="text-white/60 text-xs mt-2">{day.condition}</div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>

//         {/* Weather Map Preview */}
//         <div className="mt-8">
//           <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="text-lg font-semibold text-white">Weather Map</h3>
//               <button className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/20 rounded-lg text-white font-medium transition-colors">
//                 View Full Map
//               </button>
//             </div>
//             <div >
//               {/* <div className="text-center text-white/60">
//                 <FiNavigation className="w-12 h-12 mx-auto mb-4" />
//                 <p>Interactive weather map would appear here</p>
//                 <p className="text-sm mt-2">Showing precipitation, temperature, and wind patterns</p>
//               </div> */}
//               {/* <div className="text-center text-white/60">
//                 <Chart/>
//               </div> */}
//               <div className="col-span-2">
//                 <Chart />
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* Footer */}
//       <footer className="bg-white/5 backdrop-blur-md border-t border-white/20 mt-12">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
//             <div>
//               <div className="flex items-center space-x-2 mb-4">
//                 <FiSun className="w-6 h-6 text-white" />
//                 <span className="text-lg font-bold text-white">WeatherPro</span>
//               </div>
//               <p className="text-white/60 text-sm">Your trusted source for accurate weather forecasts and real-time conditions worldwide.</p>
//             </div>
//             <div>
//               <h4 className="text-white font-semibold mb-3">Features</h4>
//               <ul className="space-y-2 text-white/60 text-sm">
//                 <li>Current Weather</li>
//                 <li>Hourly Forecasts</li>
//                 <li>7-Day Outlook</li>
//                 <li>Weather Maps</li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="text-white font-semibold mb-3">Resources</h4>
//               <ul className="space-y-2 text-white/60 text-sm">
//                 <li>Weather Alerts</li>
//                 <li>Climate Data</li>
//                 <li>Historical Weather</li>
//                 <li>API Access</li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="text-white font-semibold mb-3">Support</h4>
//               <ul className="space-y-2 text-white/60 text-sm">
//                 <li>Help Center</li>
//                 <li>Contact Us</li>
//                 <li>Privacy Policy</li>
//                 <li>Terms of Service</li>
//               </ul>
//             </div>
//           </div>
//           <div className="border-t border-white/20 mt-8 pt-8 text-center">
//             <p className="text-white/60 text-sm">© 2024 WeatherPro. All rights reserved. Weather data provided by meteorological services.</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default WeatherHomepage;
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
