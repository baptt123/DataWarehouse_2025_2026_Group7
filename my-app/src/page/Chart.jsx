
import React, { useState, useEffect } from 'react';
import MetricChart from '../component/MetricChart'; // import chart component

export default function Chart({ city }) {  // <-- nhận city từ props
  const [metricKey, setMetricKey] = useState('humidity'); 
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return; // tránh fetch khi city rỗng
    setLoading(true);

    fetch(`http://127.0.0.1:5000/api/weather-metrics?city=${city}`)
      .then(res => res.json())
      .then(data => {
         console.log(data);
        if(data.status === "success"){
          setWeatherData(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [city]); // <-- fetch lại khi city thay đổi

  if(loading) return <div className="text-white p-4">Loading chart...</div>;
  if(!weatherData.length) return <div className="text-white p-4">No data available</div>;

  const labels = weatherData.map(d => d.forecast_date);
  const values = weatherData.map(d =>
    metricKey === 'humidity'
      ? Number(d.humidity)
      : Number(d.wind_speed)
  );
  const color = metricKey === 'humidity' ? '#0ea5e9' : '#10b981';
  const unit = metricKey === 'humidity' ? '%' : 'm/s';
  const average = values.reduce((s,v)=>s+v,0)/(values.length || 1);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">Weather Forecast Next 6 Days</h1>
        </header>

        <section className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={()=>setMetricKey('humidity')}
                className={`px-3 py-1 rounded ${metricKey==='humidity'?'bg-sky-500 text-white':'bg-slate-100 text-slate-700'}`}
              >
                Humidity
              </button>
              <button
                onClick={()=>setMetricKey('wind_speed')}
                className={`px-3 py-1 rounded ${metricKey==='wind_speed'?'bg-emerald-500 text-white':'bg-slate-100 text-slate-700'}`}
              >
                Wind Speed
              </button>
            </div>
            <div className="text-sm text-slate-600">
              Average: <span className="font-medium text-slate-800">{average.toFixed(2)} {unit}</span>
            </div>
          </div>

          <div className="w-full" style={{height:420}}>
            <MetricChart
              labels={labels}
              values={values}
              label={metricKey}
              unit={unit}
              color={color}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
