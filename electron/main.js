'use strict';

const dotenv = require('dotenv');
dotenv.config();

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { unlinkSync } = require('fs');
const Protocol = require('./protocol');
const Settings = require('./utils/settings');
const SessionManager = require('./sessions/SessionManager');
const Authentication = require('./auth/Authentication');
const protocol = new Protocol();
const settings = new Settings();
const sessionManager = new SessionManager();
const authentication = new Authentication();

sessionManager.loadSessions();

let mainWindow, splashWindow;

const createMainWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    resizable: true,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    center: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  let url = !process.env.DEV
    ? `file://${path.join(__dirname, 'index.html')}`
    : 'http://localhost:3000';

  win.loadURL(url).then();

  return win;
};

const createSplashWindow = () => {
  const win = new BrowserWindow({
    width: 480,
    height: 240,
    frame: false,
    center: true,
    transparent: true,
  });

  let url = !process.env.DEV
    ? `file://${path.join(__dirname, 'splash.html')}`
    : `file://${path.join(__dirname, '../public', 'splash.html')}`;

  win.loadURL(url).then();

  return win;
};

app.requestSingleInstanceLock();

app.whenReady().then(() => {
  mainWindow = createMainWindow();
  splashWindow = createSplashWindow();

  setTimeout(() => {
    splashWindow.close();
    mainWindow.show();
  }, 5000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
      splashWindow = createSplashWindow();

      settings.loadSettings();
      sessionManager.loadSessions();

      setTimeout(() => {
        splashWindow.close();
        mainWindow.show();
      }, 5000);
    }
  });
});

app.on('window-all-closed', () => {
  settings.saveSettings();
  sessionManager.saveSessions();

  protocol.killSharingSwarm().then(() => {
    protocol.killMessagingSwarm().then(() => {
      if (process.platform !== 'darwin') app.quit();
    });
  });
});

ipcMain.on('register', (event, data) => {
  const auth = authentication.register(data.username, data.password);

  event.reply('authenticating');

  if (!auth) event.reply('auth-register', false);
  else event.reply('auth-register', authentication.user);
});

ipcMain.on('login', (event, data) => {
  const auth = authentication.login(data.username, data.password);

  event.reply('authenticating');

  if (!auth) event.reply('auth-login', false);
  else event.reply('auth-login', authentication.user);
});

ipcMain.on('get-messages', (event, _) =>
  event.reply('messages', protocol.getMessages())
);

ipcMain.on('message', (event, data) => {
  protocol.sendMessage(data);
});

ipcMain.on('minimizeWindow', (_, __) => {
  mainWindow.minimize();
});

ipcMain.on('toggleMaximizeWindow', (_, __) => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});

ipcMain.on('closeWindow', (_, __) => {
  mainWindow.close();
});

ipcMain.on('get-files', (event, _) => {
  event.reply(
    'file-list',
    protocol.files.map((file) => {
      if (
        file.owner !==
        Buffer.from(protocol.swarm.keyPair.publicKey).toString('hex')
      )
        return {
          ...file,
          remote: true,
        };
      else return file;
    })
  );
});

ipcMain.on('add-file', (event, data) => {
  protocol.addLocalFile(data, (_event, _data) => event.reply(_event, _data));
});

ipcMain.on('remove-file', (event, data) => {
  protocol.removeLocalFile(data, (_event, _data) => event.reply(_event, _data));
});

ipcMain.on('download-file', (event, data) => {
  protocol.events.next({
    type: 'download-file',
    key: data.key,
    owner: data.owner,
  });
});

ipcMain.on('delete-file', (event, name) => {
  const filePath = path.join(process.cwd(), 'downloads', name);

  unlinkSync(filePath);

  event.reply('file-deleted', name);
});

ipcMain.on('view-downloads', () => {
  shell.openPath(path.join(process.cwd(), 'downloads')).then();
});

ipcMain.on('peer-count', (event, _) => {
  event.reply('peer-count', protocol.peerCount);
});

ipcMain.on('connect-swarm', async (event, data) => {
  protocol
    .createSwarm(data, (ev, data) => event.reply(ev, data))
    .then(() => {
      event.reply('swarm-connected');

      event.reply('peer-count', protocol.peerCount);
    });

  protocol.events.subscribe((protocolEvent) => {
    console.log(protocolEvent);

    if (protocolEvent.type === 'peer-count')
      event.reply('peer-count', protocolEvent.count);
  });
});

ipcMain.on('disconnect-swarm', (event, _) => {
  protocol.killSwarm().then(() => {
    event.reply('swarm-disconnected');

    protocol = new Protocol();

    event.reply('peer-count', protocol.peerCount);
  });
});
