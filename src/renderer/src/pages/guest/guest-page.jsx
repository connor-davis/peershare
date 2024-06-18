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
import { DownloadIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function GuestPage() {
  const navigate = useNavigate()

  const { setTheme } = useTheme()

  const { publicKey } = useParams()
  const [files, setFiles] = useState([])

  const [currentMessage, setCurrentMessage] = useState('')
  const [messages, setMessages] = useState([])

  const { addDownload, removeDownload, updateDownload, downloads } = useUploadDownloadProgress()

  useEffect(() => {
    const disposeableTimeout = setTimeout(() => {
      window.ipc.send(window.api.FrontendConstants.GET_FILES)
      window.ipc.on(window.api.FrontendConstants.FILES, (_, packet) => {
        setFiles(packet.files)
      })

      // window.ipc.send(window.api.FrontendConstants.MESSAGES)
      // window.ipc.on(window.api.FrontendConstants.MESSAGES, (_, packet) => {
      //   const messagesCopy = messages;

      //   messagesCopy.push(packet);

      //   setMessages(messagesCopy)
      // })

      window.ipc.on(window.api.Constants.PROGRESS, (_, packet) => {
        if (!downloads[packet.fileName]) {
          addDownload(packet.fileName)
        }

        updateDownload(packet.fileName, packet.progress)

        if (packet.progress.percentage === 100) {
          setTimeout(() => {
            removeDownload(packet.fileName)
          }, 2000)
        }
      })
    }, 100)

    return () => {
      clearTimeout(disposeableTimeout)
    }
  }, [])

  const downloadFile = (fileName) => {
    window.ipc.send(window.api.FrontendConstants.DOWNLOAD_FILE, { fileName })
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
            <MenubarSub>
              <MenubarSubTrigger>Theme</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onClick={() => setTheme('light')}>Light</MenubarItem>
                <MenubarItem onClick={() => setTheme('dark')}>Dark</MenubarItem>
                <MenubarItem onClick={() => setTheme('system')}>System</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem onClick={() => navigate('/settings?redirect=/guest/' + publicKey)}>
              Settings
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => exit()}>Exit</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <div className="grid grid-cols-2 w-full h-full gap-3 p-3">
        <div className="">
          <Card className="w-full h-full overflow-hidden">
            <CardContent className="w-full h-full p-3 overflow-hidden">
              <div className="flex flex-col w-full h-full overflow-hidden">
                <div className="flex items-center justify-between">
                  <Label className="text-md">Files</Label>
                </div>
                <div className="flex flex-col w-full h-full overflow-y-auto py-3">
                  {files.length > 0 &&
                    files.map((file) => (
                      <div className="flex w-full border-b py-2 border-border">
                        <div className="flex flex-col space-y-1 w-full">
                          <Label className="truncate">{file.fileName}</Label>
                          <Label className="text-muted-foreground truncate">{file.filePath}</Label>
                        </div>
                        <Button
                          size="icon"
                          className="shrink-0"
                          onClick={() => downloadFile(file.fileName)}
                        >
                          <DownloadIcon className="w-4 h-4" />
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
                <div className="flex flex-col w-full h-full overflow-y-auto py-3">
                  {messages.length > 0 &&
                    messages.map((message) => (
                      <div
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
          <Card className="w-full h-full overflow-hidden">
            <CardContent className="w-full h-full p-3 overflow-hidden">
              <div className="flex flex-col w-full h-full overflow-hidden">
                <div className="flex items-center justify-between">
                  <Label className="text-md">Downloads</Label>
                </div>
                <div className="flex flex-col w-full h-full overflow-y-auto py-3">
                  {Object.values(downloads).length > 0 &&
                    Object.values(downloads).map((download, index) => (
                      <div key={index} className="flex w-full border-b py-2 border-border">
                        <div className="flex flex-col space-y-1 w-full">
                          <Label>{download.fileName}</Label>
                          <div className="flex items-center space-x-2">
                            <Progress value={Math.ceil(download.progress.percentage)} />
                            <Label>{Math.ceil(download.progress.percentage)}%</Label>
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
