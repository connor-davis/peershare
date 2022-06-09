const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const Protocol = require('../protocol');
const protocol = new Protocol();

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // let url = `file://${path.join(process.cwd(), 'dist', 'index.html')}`;
    let url = 'http://localhost:3000';

    win.loadURL(url).then();
};

app.requestSingleInstanceLock();

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on("connect-swarm", async (event, data) => {
    await protocol.createSwarm(data);

    protocol.events.subscribe((event) => {
        console.log(event);
    });
});
