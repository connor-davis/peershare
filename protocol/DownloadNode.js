const DHT = require('@hyperswarm/dht');
const crypto = require('hypercore-crypto');
const path = require('path');
const {Subject} = require("rxjs");
const {existsSync, mkdirSync, createWriteStream} = require("fs");
const progress = require("progress-stream");

class DownloadNode {
    constructor(key, size) {
        this.key = key;
        this.size = size;
        this.events = new Subject();
        this.downloadsDirectory = path.join(process.cwd(), "downloads");

        if (!existsSync(this.downloadsDirectory))
            mkdirSync(this.downloadsDirectory);

        this.node = new DHT({});
        this.publicKey = crypto.keyPair(crypto.data(Buffer.from(this.key))).publicKey;
        this.socket = this.node.connect(this.publicKey);

        this.writeFile();
    }

    writeFile() {
        const downloadPath = path.join(this.downloadsDirectory, this.key.split("\\")[this.key.split("\\").length - 1]);
        const stream = createWriteStream(downloadPath);
        const progressStream = progress({length: this.size, time: 100});

        progressStream.on("progress", (progress) => {
            this.events.next({type: "progress", progress});

            if (progress.percentage === 100) {
                this.events.next({
                    type: "file-downloaded",
                    key: downloadPath
                });

                this.socket.end();
            }
        });

        this.socket.pipe(progressStream).pipe(stream);

        this.socket.on("open", () => console.log("File tunnel open for " + downloadPath, this.size));
    }
}

module.exports = DownloadNode;