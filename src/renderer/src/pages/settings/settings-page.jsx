import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function SettingsPage() {
  const navigate = useNavigate()

  const [searchParams, setSearchParams] = useSearchParams()
  const [settings, setSettings] = useState({})

  useEffect(() => {
    const disposeableTimeout = setTimeout(() => {
      window.ipc.send(window.api.FrontendConstants.GET_SETTINGS)
      window.ipc.on(window.api.FrontendConstants.GET_SETTINGS, (_, settings) => {
        setSettings(settings)
      })
    }, 100)

    return () => {
      clearTimeout(disposeableTimeout)
    }
  }, [])

  const updateSetting = (settingName, settingValue) => {
    window.ipc.send(window.api.FrontendConstants.SET_SETTING, { settingName, settingValue })
  }

  const chooseDirectory = (settingName) => {
    window.ipc.send(window.api.FrontendConstants.SETTINGS_CHOOSE_DIRECTORY, { settingName })
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center space-x-2">
        <Button
          className="bg-neutral-50 dark:bg-neutral-900 shadow-none text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onClick={() => navigate(searchParams.get('redirect'))}
          size="icon"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Label>Settings</Label>
      </div>
      <div className="w-full h-full overflow-hidden xl:px-64">
        <div className="flex flex-col w-full h-full space-y-10">
          <div className="flex flex-col w-full h-auto space-y-3 border p-3">
            <Label>Downloads Directory</Label>
            <Label className="text-muted-foreground">
              Which directory would you like downloads to go to?
            </Label>
            <div className="flex items-center space-x-3">
              <Input value={settings['downloadsDirectory']} disabled />
              <Button variant="outline" onClick={() => chooseDirectory('downloadsDirectory')}>
                Change
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
