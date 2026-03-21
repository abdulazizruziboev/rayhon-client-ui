import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const App = lazy(() => import('./App.jsx'))

const IOSLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white">
    <div className="h-8 w-8 rounded-full border-[3px] border-white/70 border-t-[#1bac4b] border-b-[#1bac4b] animate-[spin_0.9s_linear_infinite] shadow-[0_0_0_1px_rgba(0,0,0,0.05)]" />
  </div>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<IOSLoader />}>
      <App />
    </Suspense>
  </StrictMode>
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => console.error('Service worker register error:', error))
  })
}
