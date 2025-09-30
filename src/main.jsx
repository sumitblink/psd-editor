import { createRoot } from 'react-dom/client'
import { fabric } from 'fabric'
import App from './App.jsx'
import './index.css'

// Make fabric available globally
window.fabric = fabric;

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);