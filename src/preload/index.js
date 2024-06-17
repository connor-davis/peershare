import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Constants } from 'iris-protocol'
import PeerShareConstants from '../utils/PeerShareConstants'

// Custom APIs for renderer
const api = {
  Constants,
  FrontendConstants: PeerShareConstants
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('ipc', electronAPI.ipcRenderer)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.ipc = electronAPI.ipcRenderer
  window.api = api
}
