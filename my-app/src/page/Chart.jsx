import React, { useState, useEffect } from 'react';
import MetricChart from '../component/MetricChart';
import { FiThermometer, FiWind, FiDroplet, FiActivity } from "react-icons/fi"; // Import thêm icon cho đẹp

export default function Chart({ city }) {
  // State quản lý chỉ số đang chọn (temp, feels_like, humidity, wind_speed)
  const [metricKey, setMetricKey] = useState('temp');
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cấu hình cho 4 loại dữ liệu
  const METRICS_CONFIG = {
    temp: {
      label: 'Temperature',
      unit: '°C',
      color: '#ef4444', // Đỏ
      icon: <FiThermometer />,
      btnClass: 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200',
      activeClass: 'bg-rose-600 text-white shadow-md border-rose-600'
    },
    feels_like: {
      label: 'Feels Like',
      unit: '°C',
      color: '#f97316', // Cam
      icon: <FiActivity />,
      btnClass: 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200',
      activeClass: 'bg-orange-600 text-white shadow-md border-orange-600'
    },
    // humidity: {
    //   label: 'Humidity',
    //   unit: '%',
    //   color: '#3b82f6', // Xanh dương
    //   icon: <FiDroplet />,
    //   btnClass: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200',
    //   activeClass: 'bg-blue-600 text-white shadow-md border-blue-600'
    // },
    // wind_speed: {
    //   label: 'Wind Speed',
    //   unit: 'm/s',
    //   color: '#10b981', // Xanh lá
    //   icon: <FiWind />,
    //   btnClass: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    //   activeClass: 'bg-emerald-600 text-white shadow-md border-emerald-600'
    // }
  };

  useEffect(() => {
    if (!city) return;
    setLoading(true);

    fetch(`http://127.0.0.1:5000/api/weather-metrics?city=${encodeURIComponent(city)}`)
        .then(res => res.json())
        .then(data => {
          if(data.status === "success"){
            setWeatherData(data.data);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
  }, [city]);

  if(loading) return <div className="text-white p-4 text-center">Loading chart...</div>;
  if(!weatherData.length) return <div className="text-white p-4 text-center">No data available for {city}</div>;

  // --- XỬ LÝ DỮ LIỆU BIỂU ĐỒ ---
  const labels = weatherData.map(d => d.forecast_date);

  // Lấy dữ liệu dựa trên metricKey đang chọn
  const values = weatherData.map(d => Number(d[metricKey]));

  // Lấy cấu hình hiện tại
  const currentConfig = METRICS_CONFIG[metricKey];

  // Tính trung bình
  const average = values.reduce((s,v)=>s+v,0)/(values.length || 1);

  return (
      <div className="w-full">
        {/* Tiêu đề biểu đồ */}
        <header className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            {currentConfig.icon} {currentConfig.label} Forecast (6 Days)
          </h2>
          <div className="text-sm text-slate-800 bg-white/90 px-3 py-1 rounded-full shadow-sm">
            Avg: <span className="font-bold">{average.toFixed(2)} {currentConfig.unit}</span>
          </div>
        </header>

        <section className="bg-white rounded-xl shadow-lg p-4">

          {/* THANH ĐIỀU KHIỂN (4 NÚT) */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-6">
            {Object.keys(METRICS_CONFIG).map((key) => {
              const cfg = METRICS_CONFIG[key];
              const isActive = metricKey === key;
              return (
                  <button
                      key={key}
                      onClick={() => setMetricKey(key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border flex items-center gap-2 
                                ${isActive ? cfg.activeClass : cfg.btnClass}`}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
              )
            })}
          </div>

          {/* BIỂU ĐỒ */}
          <div className="w-full" style={{height: 350}}>
            <MetricChart
                labels={labels}
                values={values}
                label={currentConfig.label}
                unit={currentConfig.unit}
                color={currentConfig.color}
            />
          </div>
        </section>
      </div>
  )
}