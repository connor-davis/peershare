"use strict";

const dotenv = require("dotenv");
dotenv.config();

const {app, BrowserWindow, ipcMain, shell} = require('electron');
const path = require('path');
const {unlinkSync} = require("fs");
const Protocol = require('./protocol');
let protocol = new Protocol();

let mainWindow, splashWindow;

const createMainWindow = () => {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        frame: false,
        center: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    let url = !process.env.DEV ? `file://${path.join(__dirname, 'index.html')}` : 'http://localhost:3000';

    win.loadURL(url).then();

    return win;
};

const createSplashWindow = () => {
    const win = new BrowserWindow({
        width: 480,
        height: 240,
        frame: false,
        center: true,
        transparent: true
    });

    let url = !process.env.DEV ? `file://${path.join(__dirname, 'splash.html')}` : `file://${path.join(__dirname, '../public', 'splash.html')}`;

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

            setTimeout(() => {
                splashWindow.close();
                mainWindow.show();
            }, 5000);
        }
    });
});

app.on('window-all-closed', () => {
    protocol.killSwarm().then(() => {
        if (process.platform !== 'darwin') app.quit();
    });
});

ipcMain.on("get-messages", (event, _) => event.reply("messages", protocol.getMessages()));

ipcMain.on("message", (event, data) => {
    protocol.sendMessage(data);
});

ipcMain.on("minimizeWindow", (_, __) => {
    mainWindow.minimize();
});

ipcMain.on("toggleMaximizeWindow", (_, __) => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
});

ipcMain.on("closeWindow", (_, __) => {
    mainWindow.close();
});

ipcMain.on("get-files", (event, _) => {
    event.reply("file-list", protocol.files.map((file) => {
        if (file.owner !== Buffer.from(protocol.swarm.keyPair.publicKey).toString("hex")) return {
            ...file,
            remote: true
        };
        else return file;
    }));
});

ipcMain.on("add-file", (event, data) => {
    protocol.addLocalFile(data, (_event, _data) => event.reply(_event, _data));
});

ipcMain.on("remove-file", (event, data) => {
    protocol.removeLocalFile(data, (_event, _data) => event.reply(_event, _data));
});

ipcMain.on("download-file", (event, data) => {
    protocol.events.next({type: "download-file", key: data.key, owner: data.owner});
});

ipcMain.on("delete-file", (event, name) => {
    const filePath = path.join(process.cwd(), "downloads", name);

    unlinkSync(filePath);

    event.reply("file-deleted", name);
});

ipcMain.on("view-downloads", () => {
    shell.openPath(path.join(process.cwd(), "downloads")).then();
})

ipcMain.on("peer-count", (event, _) => {
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

ipcMain.on("disconnect-swarm", (event, _) => {
    protocol.killSwarm().then(() => {
        event.reply("swarm-disconnected");

        protocol = new Protocol();

        event.reply("peer-count", protocol.peerCount);
    });
})
