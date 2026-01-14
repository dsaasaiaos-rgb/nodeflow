import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initSpeedInsights } from '@/lib/speed-insights'

// Initialize Vercel Speed Insights
initSpeedInsights()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
