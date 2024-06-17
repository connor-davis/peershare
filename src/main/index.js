import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { BrowserWindow, app, dialog, ipcMain, shell } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { Constants, IrisProtocolClient, IrisProtocolServer } from 'iris-protocol'
import path, { join } from 'path'
import icon from '../../resources/icon.png?asset'
import PeerShareConstants from '../utils/PeerShareConstants'

let server
let client
let mainWindow

const readSettings = () => {
  if (!existsSync('settings.json')) {
    writeFileSync('settings.json', JSON.stringify({ downloadsDirectory: 'Downloads' }), {
      encoding: 'utf-8'
    })
  }

  const settingsString = readFileSync('settings.json', { encoding: 'utf-8' })
  const settings = JSON.parse(settingsString)

  return settings
}

const writeSetting = (key, value) => {
  const settings = readSettings()

  settings[key] = value

  writeFileSync('settings.json', JSON.stringify(settings), { encoding: 'utf-8' })
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    title: 'PeerShare',
    icon: path.join(__dirname, 'resources', 'icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.on('host', (event) => {
    server = new IrisProtocolServer()

    server.events.subscribe((rawPacket) => {
      const packetString = rawPacket.toString()
      const packet = JSON.parse(packetString)

      switch (packet.type) {
        case Constants.LISTENING:
          event.reply(packet.type, { publicKey: server.publicKey.toString('hex') })
          break

        case Constants.PROGRESS:
          event.reply(packet.type, {
            filePath: packet.filePath,
            fileName: packet.fileName,
            progress: packet.progress
          })
          break

        default:
          break
      }
    })

    server.out.subscribe((rawPacket) => {
      const packetString = rawPacket.toString()
      const packet = JSON.parse(packetString)

      switch (packet.type) {
        case Constants.FILE_LIST_ACCEPTED:
          event.reply(PeerShareConstants.FILES, { files: packet.files })
          break
        default:
          break
      }
    })
  })

  ipcMain.on('guest', (event, { publicKey }) => {
    const settings = readSettings()
    const downloadsDirectory = settings['downloadsDirectory']

    client = new IrisProtocolClient(publicKey, { downloadsDirectory })

    client.events.subscribe((rawPacket) => {
      const packetString = rawPacket.toString()
      const packet = JSON.parse(packetString)

      switch (packet.type) {
        case Constants.LISTENING:
          event.reply(Constants.LISTENING, { publicKey: client.publicKey.toString('hex') })
          break

        case Constants.PROGRESS:
          event.reply(packet.type, {
            filePath: packet.filePath,
            fileName: packet.fileName,
            progress: packet.progress
          })
          break

        default:
          break
      }
    })

    client.in.subscribe((rawPacket) => {
      const packetString = rawPacket.toString()
      const packet = JSON.parse(packetString)

      switch (packet.type) {
        case Constants.FILE_LIST_ACCEPTED:
          event.reply(PeerShareConstants.FILES, { files: packet.files })
          break
        default:
          break
      }
    })
  })

  ipcMain.on(PeerShareConstants.GET_FILES, (event) => {
    if (server) {
      return event.reply(PeerShareConstants.FILES, { files: server.files })
    }

    if (client) {
      client.getRemoteFiles().then((files) => {
        if (files.length > 0) {
          event.reply(PeerShareConstants.FILES, { files })
        }
      })

      return
    }
  })

  ipcMain.on(PeerShareConstants.ADD_FILE, (event) => {
    dialog.showOpenDialog({ properties: ['openFile'] }).then(function (response) {
      if (!response.canceled) {
        const filePath = response.filePaths[0]
        const fileName = path.basename(filePath)

        server.addFile(filePath, fileName)
      } else {
        console.log('no file selected')
      }
    })
  })

  ipcMain.on(PeerShareConstants.REMOVE_FILE, (event, { fileName }) => {
    server.removeFile(fileName)
  })

  ipcMain.on(PeerShareConstants.DOWNLOAD_FILE, (event, { fileName }) => {
    if (client) {
      client.downloadFile(fileName)

      return
    }
  })

  ipcMain.on(PeerShareConstants.SEND_MESSAGE, (event, content) => {
    if (server) {
      server.sendMessage(content)

      event.reply(PeerShareConstants.MESSAGES, {
        content,
        publicKey: server.publicKey.toString('hex')
      })
    }

    if (client) {
      client.sendMessage(content)

      event.reply(PeerShareConstants.MESSAGES, {
        content,
        publicKey: client.publicKey.toString('hex')
      })
    }
  })

  ipcMain.on(PeerShareConstants.MESSAGES, (event) => {
    if (server)
      server.in.subscribe((rawPacket) => {
        const packetString = rawPacket.toString()
        const packet = JSON.parse(packetString)

        switch (packet.type) {
          case Constants.MESSAGE:
            event.reply(PeerShareConstants.MESSAGES, {
              content: packet.content,
              publicKey: packet.publicKey
            })

            break

          default:
            break
        }
      })

    if (client)
      client.in.subscribe((rawPacket) => {
        const packetString = rawPacket.toString()
        const packet = JSON.parse(packetString)

        switch (packet.type) {
          case Constants.MESSAGE:
            event.reply(PeerShareConstants.MESSAGES, {
              content: packet.content,
              publicKey: packet.publicKey
            })

            break

          default:
            break
        }
      })
  })

  ipcMain.on(PeerShareConstants.GET_SETTINGS, (event) => {
    const settings = readSettings()

    event.reply(PeerShareConstants.GET_SETTINGS, settings)
  })

  ipcMain.on(PeerShareConstants.SET_SETTING, (_, { settingName, settingValue }) => {
    writeSetting(settingName, settingValue)
  })

  ipcMain.on(PeerShareConstants.SETTINGS_CHOOSE_DIRECTORY, (event, { settingName }) => {
    dialog.showOpenDialog({ properties: ['openDirectory'] }).then(function (response) {
      console.log(response)

      if (!response.canceled) {
        const filePath = response.filePaths[0]

        writeSetting(settingName, filePath)

        if (client) client.setDownloadsDirectory(filePath)

        const settings = readSettings()

        event.reply(PeerShareConstants.GET_SETTINGS, settings)
      } else {
        console.log('no file selected')
      }
    })
  })

  ipcMain.on('minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('exit', () => {
    mainWindow.close()
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
