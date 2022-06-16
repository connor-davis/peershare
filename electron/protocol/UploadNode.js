const {Subject} = require("rxjs");
const {createReadStream, statSync} = require("fs");
const DHT = require("@hyperswarm/dht");
const crypto = require("hypercore-crypto");
const progress = require("progress-stream");

class UploadNode {
    constructor(key, requester, size) {
        this.key = key;
        this.requester = requester;
        this.size = size;
        this.events = new Subject();

        this.node = new DHT({});
        this.keyPair = crypto.keyPair(crypto.data(Buffer.from(this.key)));
        this.server = this.node.createServer((socket) => {
            this.readFile(socket);
        });

        this.server.on("listening", () => {
            console.log("File tunnel open for " + this.key, this.size);

            this.events.next({type: "upload-ready", key: this.key, size: this.size, requester: this.requester});
        });

        this.server.on("close", () => {
            this.events.next({type: "file-uploaded", key: this.key});
        });

        this.server.listen(this.keyPair);
    }

    readFile(socket) {
        const stream = createReadStream(this.key);
        const progressStream = progress({length: this.size, time: 100});

        progressStream.on("progress", async (progress) => {
            this.events.next({type: "progress", progress});

            if (progress.percentage === 100) {
                console.log("Closing tunnel.");

                await this.server.close();

                console.log("Tunnel closed.");
            }
        });

        stream.pipe(progressStream).pipe(socket);
    }
}

module.exports = UploadNode;