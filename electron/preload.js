const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('send', (event, data) => {
  ipcRenderer.send(event, data);
});
contextBridge.exposeInMainWorld('receive', (event, listener) => {
  ipcRenderer.on(event, listener);
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing protocol and versions.');

  const CHROME_VERSION = process.versions['chrome'];
  const NODE_VERSION = process.versions['node'];
  const ELECTRON_VERSION = process.versions['electron'];

  let versions = {
    CHROME_VERSION,
    NODE_VERSION,
    ELECTRON_VERSION,
  };

  console.log(
    'Versions:\n',
    `Chrome: ${versions.CHROME_VERSION}\n`,
    `NodeJS: ${versions.NODE_VERSION}\n`,
    `Electron: ${versions.ELECTRON_VERSION}\n`
  );

  const log = (message) => {
    console.log('> ' + message);
  };

  contextBridge.exposeInMainWorld('versions', versions);
  contextBridge.exposeInMainWorld('log', log);
});
