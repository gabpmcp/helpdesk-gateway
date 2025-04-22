import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary'
import { loadRuntimeConfig } from './config/runtimeConfig'
import { createStore } from './store'

console.log('Main.tsx is being executed')

const rootElement = document.getElementById('root')
console.log('Root element found:', rootElement)
if (!rootElement) throw new Error('Failed to find the root element')

loadRuntimeConfig().then(() => {
  const store = createStore();
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
}).catch(error => {
  console.error(' Error fatal cargando la configuración:', error)
  
  // Renderizar página de error
  const root = createRoot(rootElement)
  root.render(
    <div className="error-container" style={{ 
      padding: '2rem', 
      maxWidth: '600px', 
      margin: '0 auto', 
      fontFamily: 'system-ui' 
    }}>
      <h1>Error de Configuración</h1>
      <p>No se pudo cargar la configuración necesaria para iniciar la aplicación.</p>
      <p style={{ color: 'red' }}>{error.message}</p>
      <div style={{ marginTop: '2rem' }}>
        <p><strong>Soluciones posibles:</strong></p>
        <ul>
          <li>Verifica que el archivo <code>config.json</code> exista en la raíz</li>
          <li>Comprueba que el formato JSON sea válido</li>
          <li>En desarrollo, verifica que el archivo <code>.env</code> contenga las variables necesarias</li>
        </ul>
      </div>
    </div>
  )
})
