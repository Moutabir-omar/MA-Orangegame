"use client"

import { useEffect, useRef } from "react"

interface GameChartProps {
  data: number[] | number[][]
  color: string | string[]
  type: "bar" | "line"
  maxValue?: number
  labels?: string[] | number[]
  title?: string
  yLabel?: string
  xLabel?: string
  legend?: string[]
}

export function GameChart({ data, color, type, maxValue, labels, title, yLabel, xLabel, legend }: GameChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set dimensions
    const width = canvas.width
    const height = canvas.height
    const padding = { top: 30, right: 20, bottom: 30, left: 40 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Determine if data is multi-series
    const isMultiSeries = Array.isArray(data[0])
    const seriesData = isMultiSeries ? (data as number[][]) : [data as number[]]
    const seriesColors = Array.isArray(color) ? color : [color as string]

    // Calculate max value for y-axis
    const calculatedMax = isMultiSeries
      ? Math.max(...seriesData.map((series) => Math.max(...series)))
      : Math.max(...seriesData[0])
    const yMax = maxValue || calculatedMax || 10

    // Draw title if provided
    if (title) {
      ctx.fillStyle = "#374151"
      ctx.font = "bold 12px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(title, width / 2, 15)
    }

    // Draw y-axis
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, height - padding.bottom)
    ctx.strokeStyle = "#E5E7EB"
    ctx.stroke()

    // Draw y-axis labels
    const ySteps = 5
    ctx.fillStyle = "#9CA3AF"
    ctx.font = "10px sans-serif"
    ctx.textAlign = "right"

    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (chartHeight * i) / ySteps
      const value = Math.round(yMax - (i / ySteps) * yMax)
      ctx.fillText(value.toString(), padding.left - 5, y + 3)

      // Draw horizontal grid lines
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.strokeStyle = "#F3F4F6"
      ctx.stroke()
    }

    // Draw x-axis
    ctx.beginPath()
    ctx.moveTo(padding.left, height - padding.bottom)
    ctx.lineTo(width - padding.right, height - padding.bottom)
    ctx.strokeStyle = "#E5E7EB"
    ctx.stroke()

    // Draw x-axis labels if provided
    if (labels) {
      ctx.fillStyle = "#9CA3AF"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"

      const step = chartWidth / (labels.length - 1 || 1)
      labels.forEach((label, i) => {
        const x = padding.left + i * step
        ctx.fillText(label.toString(), x, height - padding.bottom + 15)
      })
    }

    // Draw axis labels if provided
    if (yLabel) {
      ctx.save()
      ctx.fillStyle = "#6B7280"
      ctx.font = "10px sans-serif"
      ctx.translate(10, height / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = "center"
      ctx.fillText(yLabel, 0, 0)
      ctx.restore()
    }

    if (xLabel) {
      ctx.fillStyle = "#6B7280"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(xLabel, width / 2, height - 5)
    }

    // Draw legend if provided
    if (legend && isMultiSeries) {
      const legendX = width - padding.right - 100
      const legendY = padding.top

      legend.forEach((item, i) => {
        const y = legendY + i * 15

        // Draw legend color box
        ctx.fillStyle = seriesColors[i] || "#000000"
        ctx.fillRect(legendX, y, 10, 10)

        // Draw legend text
        ctx.fillStyle = "#374151"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "left"
        ctx.fillText(item, legendX + 15, y + 8)
      })
    }

    // Draw data
    seriesData.forEach((series, seriesIndex) => {
      const currentColor = seriesColors[seriesIndex] || "#000000"

      if (type === "bar") {
        const barWidth = chartWidth / (series.length * 2)
        const barSpacing = chartWidth / series.length

        ctx.fillStyle = currentColor

        series.forEach((value, i) => {
          const barHeight = (value / yMax) * chartHeight
          const x = padding.left + i * barSpacing + barWidth / 2
          const y = height - padding.bottom - barHeight

          ctx.fillRect(x, y, barWidth, barHeight)
        })
      } else if (type === "line") {
        const step = chartWidth / (series.length - 1 || 1)

        // Draw line
        ctx.beginPath()
        series.forEach((value, i) => {
          const x = padding.left + i * step
          const y = height - padding.bottom - (value / yMax) * chartHeight

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.strokeStyle = currentColor
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw points
        series.forEach((value, i) => {
          const x = padding.left + i * step
          const y = height - padding.bottom - (value / yMax) * chartHeight

          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fillStyle = currentColor
          ctx.fill()
        })
      }
    })
  }, [data, color, type, maxValue, labels, title, yLabel, xLabel, legend])

  return <canvas ref={canvasRef} width="500" height="200" className="w-full h-full" />
}

