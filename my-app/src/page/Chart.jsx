// import React, { useState } from 'react'
// import MetricChart from '../component/MetricChart'
//
// const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
//
// // Dữ liệu mẫu 12 tháng (thay bằng dữ liệu thực nếu cần)
// const DATA = {
//   temperature: {
//     label: 'Nhiệt độ (°C)',
//     unit: '°C',
//     values: [2, 3, 7, 12, 17, 21, 24, 24, 20, 14, 8, 4],
//     color: '#ef4444'
//   },
//   perceived: {
//     label: 'Nhiệt độ cảm nhận (°C)',
//     unit: '°C',
//     values: [1, 2, 6, 11, 16, 20, 23, 23, 19, 13, 7, 3],
//     color: '#f97316'
//   },
//   humidity: {
//     label: 'Độ ẩm (%)',
//     unit: '%',
//     values: [78, 75, 72, 68, 66, 63, 61, 62, 67, 73, 76, 80],
//     color: '#0ea5e9'
//   },
//   windSpeed: {
//     label: 'Tốc độ gió (m/s)',
//     unit: 'm/s',
//     values: [4.2,3.8,4.0,3.7,3.1,2.7,2.4,2.6,3.0,3.5,4.0,4.3],
//     color: '#10b981'
//   }
// }
//
// export default function Chart() {
//   const [metricKey, setMetricKey] = useState('humidity') // mặc định chọn độ ẩm
//
//   const metric = DATA[metricKey]
//   const average = metric.values.reduce((s,v)=>s+v,0) / metric.values.length
//
//   return (
//     <div className="min-h-screen bg-slate-50 p-6">
//       <div className="max-w-4xl mx-auto">
//         <header className="mb-6">
//           <h1 className="text-2xl font-semibold text-slate-800">The chart of month</h1>
//           <p className="text-slate-600 text-sm mt-1">Select a metric to view the 12-month bar chart and the average line.</p>
//         </header>
//
//         <section className="bg-white rounded-lg shadow p-4">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex gap-2">
//               {/* Nhiệt độ */}
//               <button
//                 onClick={() => setMetricKey('temperature')}
//                 className={`px-3 py-1 rounded ${metricKey === 'temperature' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-700'}`}
//               >
//                 temperature
//               </button>
//               {/* Nhiệt độ cảm nhận */}
//               <button
//                 onClick={() => setMetricKey('perceived')}
//                 className={`px-3 py-1 rounded ${metricKey === 'perceived' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-700'}`}
//               >
//                 perceived
//               </button>
//               {/* Độ ẩm */}
//               <button
//                 onClick={() => setMetricKey('humidity')}
//                 className={`px-3 py-1 rounded ${metricKey === 'humidity' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-700'}`}
//               >
//                 humidity
//               </button>
//               {/* Tốc độ gió */}
//               <button
//                 onClick={() => setMetricKey('windSpeed')}
//                 className={`px-3 py-1 rounded ${metricKey === 'windSpeed' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700'}`}
//               >
//                 windSpeed
//               </button>
//             </div>
//
//             <div className="text-sm text-slate-600">
//               Trung bình: <span className="font-medium text-slate-800">{average.toFixed(2)} {metric.unit}</span>
//             </div>
//           </div>
//
//           <div className="w-full" style={{height: 420}}>
//             <MetricChart
//               labels={months}
//               values={metric.values}
//               label={metric.label}
//               unit={metric.unit}
//               color={metric.color}
//             />
//           </div>
//         </section>
//
//         <footer className="text-sm text-slate-500 mt-4">
//           The chart illustrate value of {metricKey} during the period
//         </footer>
//       </div>
//     </div>
//   )
// }




import React, { useState, useEffect } from 'react'
import { FiMapPin } from "react-icons/fi";
import MetricChart from '../component/MetricChart'

export default function Chart() {
  const [metricKey, setMetricKey] = useState('temperature')
  const [cities, setCities] = useState([])
  const [selectedCity, setSelectedCity] = useState('')
  const [chartData, setChartData] = useState(null)

  // Khởi tạo là true để lần load đầu tiên không bị lỗi giao diện
  const [loading, setLoading] = useState(true)

  const CONFIG = {
    temperature: { label: 'Nhiệt độ (°C)', unit: '°C', color: '#ef4444' },
    perceived: { label: 'Cảm nhận (°C)', unit: '°C', color: '#f97316' }
  }

  // 1. Load danh sách thành phố
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/cities')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.cities.length > 0) {
            setCities(data.cities)
            // Chọn thành phố đầu tiên, nhưng KHÔNG cần set loading ở đây
            // vì mặc định loading đã là true
            setSelectedCity(data.cities[0])
          } else {
            setLoading(false)
          }
        })
        .catch(err => {
          console.error(err)
          setLoading(false)
        })
  }, [])

  // 2. Load dữ liệu thời tiết (ĐÃ SỬA LOGIC)
  useEffect(() => {
    // Nếu chưa có city thì không làm gì cả
    if (!selectedCity) return;

    // --- FIX LỖI Ở ĐÂY: Bỏ dòng setLoading(true) ---
    // Việc setLoading(true) sẽ được xử lý ở sự kiện onChange hoặc khởi tạo

    // Dùng AbortController để cleanup nếu component unmount (Best practice)
    const controller = new AbortController();

    fetch(`http://127.0.0.1:5000/api/weather-forecast?city=${encodeURIComponent(selectedCity)}`, {
      signal: controller.signal
    })
        .then(res => res.json())
        .then(apiRes => {
          if (apiRes.status === 'success') {
            setChartData({
              labels: apiRes.labels,
              values: {
                temperature: apiRes.datasets.temperature,
                perceived: apiRes.datasets.perceived
              },
              averages: {
                temperature: apiRes.averages.temperature,
                perceived: apiRes.averages.perceived
              }
            })
          } else {
            setChartData(null)
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') console.error("Lỗi tải dữ liệu:", err)
        })
        .finally(() => {
          // Luôn tắt loading khi fetch xong (dù thành công hay thất bại)
          setLoading(false)
        })

    return () => controller.abort(); // Cleanup
  }, [selectedCity])


  // 3. Hàm xử lý khi người dùng đổi thành phố
  const handleCityChange = (e) => {
    const newCity = e.target.value;
    if (newCity === selectedCity) return;

    // --- FIX LỖI: Bật loading TẠI ĐÂY ---
    // Khi người dùng chọn, ta bật loading ngay lập tức, sau đó mới đổi state city
    setLoading(true);
    setSelectedCity(newCity);
  }

  // --- PHẦN RENDER GIỮ NGUYÊN ---
  if (loading && cities.length === 0) return <div className="p-4 text-white">Đang khởi tạo...</div>

  return (
      <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <FiMapPin />
            </div>
            {/* Gắn hàm handleCityChange vào đây */}
            <select
                value={selectedCity}
                onChange={handleCityChange}
                className="pl-9 pr-8 py-2 bg-white/90 text-slate-800 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer min-w-[180px]"
            >
              {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-white/20 p-1 rounded-lg">
            <button
                onClick={() => setMetricKey('temperature')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    metricKey === 'temperature'
                        ? 'bg-rose-500 text-white shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
            >
              Nhiệt độ
            </button>
            <button
                onClick={() => setMetricKey('perceived')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    metricKey === 'perceived'
                        ? 'bg-orange-500 text-white shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
            >
              Cảm nhận
            </button>
          </div>
        </div>

        {loading ? (
            <div className="h-[300px] flex items-center justify-center text-white/60">Đang tải dữ liệu...</div>
        ) : chartData ? (
            <div className="bg-white rounded-xl p-4 shadow-inner">
              <div className="flex justify-between items-end mb-2">
                <h4 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Dự báo 6 ngày tới ({chartData.city})</h4>
                <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  Trung bình: <span className="font-bold text-slate-800">
                            {chartData.averages[metricKey]} {CONFIG[metricKey].unit}
                        </span>
                </div>
              </div>

              <div className="w-full" style={{height: 300}}>
                <MetricChart
                    labels={chartData.labels}
                    values={chartData.values[metricKey] || []}
                    label={CONFIG[metricKey].label}
                    unit={CONFIG[metricKey].unit}
                    color={CONFIG[metricKey].color}
                />
              </div>
            </div>
        ) : (
            <div className="h-[300px] flex items-center justify-center text-white/60">Không có dữ liệu cho thành phố này.</div>
        )}
      </div>
  )
}