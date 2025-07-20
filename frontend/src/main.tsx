import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { handlePageRefresh, setupTokenPersistence } from './utils/tokenManager'
import './index.css'
import App from './App.tsx'

// Initialize token management on app startup
handlePageRefresh();
setupTokenPersistence();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
