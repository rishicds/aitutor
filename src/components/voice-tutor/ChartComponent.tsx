/* eslint-disable */
"use client"

import { useEffect, useRef } from "react"
import Chart, { ChartTypeRegistry } from "chart.js/auto"

interface ChartComponentProps {
  data: {
    type: keyof ChartTypeRegistry
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string | string[]
      borderWidth?: number
    }[]
    options?: any
  }
  className?: string
}

export default function ChartComponent({ data, className }: ChartComponentProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Create new chart
    const ctx = chartRef.current.getContext("2d")
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: data.type || "bar",
        data: {
          labels: data.labels,
          datasets: data.datasets.map((dataset) => ({
            label: dataset.label,
            data: dataset.data,
            backgroundColor: dataset.backgroundColor || [
              "rgba(139, 92, 246, 0.2)",
              "rgba(79, 70, 229, 0.2)",
              "rgba(16, 185, 129, 0.2)",
              "rgba(245, 158, 11, 0.2)",
              "rgba(239, 68, 68, 0.2)",
              "rgba(99, 102, 241, 0.2)",
            ],
            borderColor: dataset.borderColor || [
              "rgba(139, 92, 246, 1)",
              "rgba(79, 70, 229, 1)",
              "rgba(16, 185, 129, 1)",
              "rgba(245, 158, 11, 1)",
              "rgba(239, 68, 68, 1)",
              "rgba(99, 102, 241, 1)",
            ],
            borderWidth: dataset.borderWidth || 1,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...data.options,
        },
      })
    }

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data])

  return (
    <div className={`w-full h-full ${className || ""}`}>
      <canvas ref={chartRef} />
    </div>
  )
}
