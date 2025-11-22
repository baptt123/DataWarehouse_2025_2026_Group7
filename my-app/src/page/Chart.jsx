import React, { useState } from 'react'
import MetricChart from '../component/MetricChart'

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Dữ liệu mẫu 12 tháng (thay bằng dữ liệu thực nếu cần)
const DATA = {
  temperature: {
    label: 'Nhiệt độ (°C)',
    unit: '°C',
    values: [2, 3, 7, 12, 17, 21, 24, 24, 20, 14, 8, 4],
    color: '#ef4444'
  },
  perceived: {
    label: 'Nhiệt độ cảm nhận (°C)',
    unit: '°C',
    values: [1, 2, 6, 11, 16, 20, 23, 23, 19, 13, 7, 3],
    color: '#f97316'
  },
  humidity: {
    label: 'Độ ẩm (%)',
    unit: '%',
    values: [78, 75, 72, 68, 66, 63, 61, 62, 67, 73, 76, 80],
    color: '#0ea5e9'
  },
  windSpeed: {
    label: 'Tốc độ gió (m/s)',
    unit: 'm/s',
    values: [4.2,3.8,4.0,3.7,3.1,2.7,2.4,2.6,3.0,3.5,4.0,4.3],
    color: '#10b981'
  }
}

export default function Chart() {
  const [metricKey, setMetricKey] = useState('humidity') // mặc định chọn độ ẩm

  const metric = DATA[metricKey]
  const average = metric.values.reduce((s,v)=>s+v,0) / metric.values.length

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">The chart of month</h1>
          <p className="text-slate-600 text-sm mt-1">Select a metric to view the 12-month bar chart and the average line.</p>
        </header>

        <section className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {/* Nhiệt độ */}
              <button
                onClick={() => setMetricKey('temperature')}
                className={`px-3 py-1 rounded ${metricKey === 'temperature' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                temperature
              </button>
              {/* Nhiệt độ cảm nhận */}
              <button
                onClick={() => setMetricKey('perceived')}
                className={`px-3 py-1 rounded ${metricKey === 'perceived' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                perceived
              </button>
              {/* Độ ẩm */}
              <button
                onClick={() => setMetricKey('humidity')}
                className={`px-3 py-1 rounded ${metricKey === 'humidity' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                humidity
              </button>
              {/* Tốc độ gió */}
              <button
                onClick={() => setMetricKey('windSpeed')}
                className={`px-3 py-1 rounded ${metricKey === 'windSpeed' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                windSpeed
              </button>
            </div>

            <div className="text-sm text-slate-600">
              Trung bình: <span className="font-medium text-slate-800">{average.toFixed(2)} {metric.unit}</span>
            </div>
          </div>

          <div className="w-full" style={{height: 420}}>
            <MetricChart
              labels={months}
              values={metric.values}
              label={metric.label}
              unit={metric.unit}
              color={metric.color}
            />
          </div>
        </section>

        <footer className="text-sm text-slate-500 mt-4">
          The chart illustrate value of {metricKey} during the period
        </footer>
      </div>
    </div>
  )
}