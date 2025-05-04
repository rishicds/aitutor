export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface ChartData {
  type: string
  title?: string
  description?: string
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

export interface Resource {
  type: string
  title: string
  url: string
  description?: string
  source?: string
  thumbnail?: string
} 