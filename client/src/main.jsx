import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { store } from './app/store.js'
import { Provider } from 'react-redux'
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
    throw new Error('Missing publishable key')
}

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} allowedRedirectOrigins={[
        "https://project-mgt-omega-nine.vercel.app",
        "http://localhost:5173"
      ]}>
            <Provider store={store}>
                <App />
            </Provider>
        </ClerkProvider>
    </BrowserRouter>,
)