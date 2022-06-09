const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const Protocol = require('../protocol');
let protocol = new Protocol();

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

ipcMain.on("add-file", (event, data) => {
    protocol.addFile(data, true, (event, data) => event.reply(event, data));

    event.reply("file-list", protocol.files);
});

ipcMain.on("remove-file", (event, data) => {
    protocol.removeFile(data, true, (event, data) => event.reply(event, data));

    event.reply("file-list", protocol.files);
});

ipcMain.on("download-file", (event, path) => {
    protocol.events.next({ type: "download-file", key: path });
});

ipcMain.on("peer-count", (event, data) => {
    event.reply("peer-count", protocol.peerCount);
});

ipcMain.on("connect-swarm", async (event, data) => {
    protocol.createSwarm(data, (ev, data) => event.reply(ev, data)).then(() => {
        event.reply("swarm-connected");

        event.reply("peer-count", protocol.peerCount);
    });

    protocol.events.subscribe((protocolEvent) => {
        console.log(protocolEvent);

        if (protocolEvent.type === "peer-count") event.reply("peer-count", protocolEvent.count);
    });
});

ipcMain.on("disconnect-swarm", (event, data) => {
    protocol.killSwarm().then(() => {
        event.reply("swarm-disconnected");

        protocol = new Protocol();

        event.reply("peer-count", protocol.peerCount);
    });
})
