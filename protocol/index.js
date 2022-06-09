const HyperSwarm = require("hyperswarm");
const {Subject} = require('rxjs');
const {statSync} = require("fs");
const UploadNode = require("./UploadNode");
const DownloadNode = require("./DownloadNode");

class Protocol {
    constructor() {
        this.peerCount = 0;
        this.connections = [];
        this.events = new Subject();
    }

    async createSwarm(domain) {
        this.peerCount = 0;

        console.log('Creating swarm on - ' + domain);

        this.domain = domain;
        this.swarm = new HyperSwarm();

        process.once('SIGINT', function () {
            this.swarm.once('close', function () {
                process.exit();
            });
            this.swarm.destroy();
            setTimeout(() => process.exit(), 2000);
        });

        this.swarm.on("connection", (connection, information) => {
            if (information.type === 'utp') {
                information.backoff();
                connection.destroy();
            }

            this.connections.push(connection);

            this.peerCount = this.peerCount + 1;

            this.events.next({type: "peer-count", count: this.peerCount});

            connection.write(JSON.stringify({type: "ping"}));
            connection.on("data", (data) =>
                this.events.next(JSON.parse(data.toString()))
            );

            this.events.subscribe((event) => {
                if (event.type === "disconnect") {
                    if (this.peerCount > 0) {
                        this.peerCount = this.peerCount - 1;

                        this.events.next({type: "peer-count", count: this.peerCount});
                    }

                    return connection.end();
                }

                if (event.type === "pong") return console.log("Peer pong.");

                if (event.type === "ping") {
                    console.log("Peer ping.");

                    return connection.write(JSON.stringify({type: "pong"}));
                }

                if (event.type === "request-download") {
                    const {key} = event;
                    const size = statSync(key).size;

                    const node = new UploadNode(key, size);

                    node.events.subscribe((nodeEvent) => {
                        if (nodeEvent.type === "progress") return this.events.next(nodeEvent);
                        if (nodeEvent.type === "file-uploaded") return this.events.next(nodeEvent);
                        if (nodeEvent.type === "upload-ready") return connection.write(JSON.stringify(nodeEvent));
                    });

                    return;
                }

                if (event.type === "upload-ready") {
                    const {key, size} = event;

                    const node = new DownloadNode(key, size);

                    node.events.subscribe((nodeEvent) => {
                        if (nodeEvent.type === "progress") return this.events.next(nodeEvent);
                        if (nodeEvent.type === "file-downloaded") return this.events.next(nodeEvent);
                    });
                }
            });
        });

        this.topic = Buffer.alloc(32).fill(domain);
        this.discovery = this.swarm.join(this.topic, {server: true, client: true});

        await this.discovery.flushed();

        return this.topic;
    }

    async killSwarm() {
        return new Promise(async (resolve, reject) => {
            console.log(this.topic);

            this.connections.forEach((connection) => connection.write(JSON.stringify({ type: "disconnect" })));

            await this.swarm.leave(this.topic);
            await this.discovery.destroy();
            await this.swarm.destroy();

            this.peerCount = 0;

            console.log('Leaving swarm on - ' + this.domain);

            resolve(this.peerCount);
        });
    }
}

module.exports = Protocol;
