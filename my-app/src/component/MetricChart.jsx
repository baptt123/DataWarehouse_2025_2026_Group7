import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'

// Đăng ký các phần cần thiết của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function MetricChart({ labels = [], values = [], label = '', unit = '', color = '#3b82f6' }) {
  const avg = useMemo(() => {
    if (!values || values.length === 0) return 0
    return values.reduce((s,v) => s + v, 0) / values.length
  }, [values])

  const data = useMemo(() => {
    return {
      labels,
      datasets: [
        {
          type: 'bar',
          label,
          data: values,
          backgroundColor: color,
          borderRadius: 6,
        },
        {
          type: 'line',
          label: `Trung bình (${avg.toFixed(2)} ${unit})`,
          data: labels.map(() => Number(avg.toFixed(2))),
          borderColor: '#111827',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0,
          fill: false,
          yAxisID: 'y'
        }
      ]
    }
  }, [labels, values, label, avg, color, unit])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const dsLabel = context.dataset.label || ''
            const val = context.formattedValue
            // Với dataset line (trung bình) hiển thị đơn vị luôn
            return `${dsLabel}: ${val} ${unit}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (v) => `${v} ${unit}`.trim()
        },
        title: {
          display: true,
          text: unit
        }
      }
    }
  }), [unit])

  return <Chart type='bar' data={data} options={options} />
}