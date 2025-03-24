import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'

console.log('Main.tsx is being executed')

const rootElement = document.getElementById('root')
console.log('Root element found:', rootElement)
if (!rootElement) throw new Error('Failed to find the root element')

const root = createRoot(rootElement)
console.log('React root created')

root.render(
  <StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Provider>
  </StrictMode>
)
console.log('Root render called')
