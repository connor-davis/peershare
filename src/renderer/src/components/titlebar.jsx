import { Minus, X } from 'lucide-react'
import { Button } from './ui/button'
import { Label } from './ui/label'

export default function Titlebar() {
  const minimize = () => {
    window.ipc.send('minimize')
  }

  const exit = () => {
    window.ipc.send('exit')
  }

  return (
    <div className="flex items-center">
      <Label className="text-primary px-[6px] draggable">PeerShare</Label>
      <div className="flex w-full h-6 draggable"></div>

      <div className="flex items-center">
        <Button
          className="p-1 w-6 h-6 rounded-none bg-neutral-50 dark:bg-neutral-900 shadow-none text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onClick={() => minimize()}
        >
          <Minus className="w-4 h-4" size="icon" />
        </Button>
        <Button
          className="p-1 w-6 h-6 rounded-none bg-neutral-50 dark:bg-neutral-900 shadow-none text-black dark:text-white hover:bg-red-600 dark:hover:bg-red-600 hover:text-white"
          onClick={() => exit()}
        >
          <X className="w-3 h-3" size="icon" />
        </Button>
      </div>
    </div>
  )
}
