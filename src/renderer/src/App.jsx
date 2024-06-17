import { HashRouter, Route, Routes } from 'react-router-dom'
import RootLayout from './components/root-layout'
import { ThemeProvider } from './components/theme-provider'
import WelcomePage from './pages/welcome/welcome-page'
import HostSetupPage from './pages/host/setup/setup-page'
import GuestSetupPage from './pages/guest/setup/setup-page'
import HostPage from './pages/host/host-page'
import GuestPage from './pages/guest/guest-page'
import SettingsPage from './pages/settings/settings-page'

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/host-setup" element={<HostSetupPage />} />
            <Route path="/guest-setup" element={<GuestSetupPage />} />
            <Route path="/host/:publicKey" element={<HostPage />} />
            <Route path="/guest/:publicKey" element={<GuestPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  )
}

export default App
