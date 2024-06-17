import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger
} from '@/components/ui/menubar'
import { Progress } from '@/components/ui/progress'
import useUploadDownloadProgress from '@/lib/state/udProgress'
import { TrashIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

export default function HostPage() {
  const navigate = useNavigate()

  const { setTheme } = useTheme()

  const { publicKey } = useParams()
  const [files, setFiles] = useState([])

  const [currentMessage, setCurrentMessage] = useState('')
  const [messages, setMessages] = useState([])

  const { addUpload, removeUpload, updateUpload, uploads } = useUploadDownloadProgress()

  useEffect(() => {
    const disposeableTimeout = setTimeout(() => {
      window.ipc.send(window.api.FrontendConstants.GET_FILES)
      window.ipc.on(window.api.FrontendConstants.FILES, (_, packet) => {
        setFiles(packet.files)
      })

      // window.ipc.send(window.api.FrontendConstants.MESSAGES)
      // window.ipc.on(window.api.FrontendConstants.MESSAGES, (_, packet) => {
      //   setMessages([...messages, packet])
      // })

      window.ipc.on(window.api.Constants.PROGRESS, (_, packet) => {
        if (!uploads[packet.fileName]) {
          addUpload(packet.fileName)
        }

        updateUpload(packet.fileName, packet.progress)

        if (packet.progress.percentage === 100) {
          setTimeout(() => {
            removeUpload(packet.fileName)
          }, 2000)
        }
      })
    }, 100)

    return () => {
      clearTimeout(disposeableTimeout)
    }
  }, [])

  const addFile = () => {
    window.ipc.send(window.api.FrontendConstants.ADD_FILE)
  }

  const removeFile = (fileName) => {
    window.ipc.send(window.api.FrontendConstants.REMOVE_FILE, { fileName })
  }

  const sendMessage = () => {
    if (currentMessage.length === 0 || currentMessage.replace(' ', '').length === 0) return

    // window.ipc.send(window.api.FrontendConstants.SEND_MESSAGE, currentMessage)
  }

  const exit = () => {
    window.ipc.send('exit')
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <Menubar className="border-l-0 border-t-0 border-r-0 shadow-none rounded-none">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => addFile()}>Add File</MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Theme</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onClick={() => setTheme('light')}>Light</MenubarItem>
                <MenubarItem onClick={() => setTheme('dark')}>Dark</MenubarItem>
                <MenubarItem onClick={() => setTheme('system')}>System</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem onClick={() => navigate('/settings?redirect=/host/' + publicKey)}>
              Settings
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => exit()}>Exit</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Session</MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onClick={() => {
                if (window.navigator) {
                  window.navigator.clipboard.writeText(publicKey)

                  toast.success('Info', {
                    description: 'Your session key has been copied to your clipboard.'
                  })
                }
              }}
            >
              Share Session
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <div className="grid grid-cols-2 w-full h-full gap-3 p-3">
        <div className="">
          <Card className="w-full h-full overflow-hidden shadow-none">
            <CardContent className="w-full h-full p-3 overflow-hidden">
              <div className="flex flex-col w-full h-full overflow-hidden">
                <div className="flex items-center justify-between">
                  <Label className="text-md">Files</Label>
                </div>
                <div className="flex flex-col w-full h-full overflow-y-auto py-3">
                  {files.length > 0 &&
                    files.map((file, index) => (
                      <div key={index} className="flex w-full border-b py-2 border-border">
                        <div className="flex flex-col space-y-1 w-full">
                          <Label>{file.fileName}</Label>
                          <Label className="text-muted-foreground truncate text-ellipsis">
                            {file.filePath}
                          </Label>
                        </div>
                        <Button
                          size="icon"
                          className="shrink-0"
                          onClick={() => removeFile(file.fileName)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* <div className="row-span-2">
          <Card className="w-full h-full">
            <CardContent className="w-full h-full p-3 overflow-hidden">
              <div className="flex flex-col w-full h-full overflow-hidden">
                <div className="flex items-center justify-between">
                  <Label className="text-md">Chat</Label>
                </div>
                <div className="flex flex-col w-full h-full overflow-y-auto py-3 space-y-1">
                  {messages.length > 0 &&
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex flex-col space-y-1 w-full rounded p-2',
                          message.publicKey === publicKey && 'bg-primary text-primary-foreground',
                          message.publicKey !== publicKey && 'bg-muted text-primary-foreground'
                        )}
                      >
                        <Label>{message.content}</Label>
                      </div>
                    ))}
                </div>
                <div className="flex space-x-3 w-full h-auto">
                  <Textarea
                    placeholder="Type a message..."
                    value={currentMessage}
                    onChange={(event) => setCurrentMessage(event.target.value)}
                  ></Textarea>
                  <Button size="icon" onClick={() => sendMessage()}>
                    <SendIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}
        <div className="">
          <Card className="w-full h-full overflow-hidden shadow-none">
            <CardContent className="w-full h-full p-3 overflow-hidden">
              <div className="flex flex-col w-full h-full overflow-hidden">
                <div className="flex items-center justify-between">
                  <Label className="text-md">Uploads</Label>
                </div>
                <div className="flex flex-col w-full h-full overflow-y-auto py-3">
                  {Object.values(uploads).length > 0 &&
                    Object.values(uploads).map((upload, index) => (
                      <div key={index} className="flex w-full border-b py-2 border-border">
                        <div className="flex flex-col space-y-1 w-full">
                          <Label>{upload.fileName}</Label>
                          <div className="flex items-center space-x-2">
                            <Progress value={Math.ceil(upload.progress.percentage)} />
                            <Label>{Math.ceil(upload.progress.percentage)}%</Label>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
