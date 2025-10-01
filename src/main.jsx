import React from 'react'
import ReactDOM from 'react-dom/client'
import { fabric } from 'fabric'
import App from './App.jsx'
import './index.css'

// Make fabric available globally
window.fabric = fabric;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)