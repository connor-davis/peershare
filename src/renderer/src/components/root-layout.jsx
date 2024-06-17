import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useTheme } from './theme-provider'
import Titlebar from './titlebar'

export default function RootLayout() {
  const { theme } = useTheme()
  return (
    <div className="flex flex-col w-screen h-screen bg-background select-none">
      <Titlebar />
      <Outlet />
      <Toaster theme={theme} />
    </div>
  )
}
