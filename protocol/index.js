const HyperSwarm = require("hyperswarm");
const {Subject} = require('rxjs');
const {statSync} = require("fs");
const UploadNode = require("./UploadNode");
const DownloadNode = require("./DownloadNode");

class Protocol {
    constructor() {
        this.domain = undefined;
        this.events = new Subject();
    }

    async createSwarm(domain) {
        console.log('Creating swarm on - ' + domain);

        const swarm = new HyperSwarm();

        swarm.on("connection", (connection, information) => {
            connection.write(JSON.stringify({type: "ping"}));
            connection.on("data", (data) =>
                this.events.next(JSON.parse(data.toString()))
            );

            this.events.subscribe((event) => {
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

        const topic = Buffer.alloc(32).fill(domain);
        const discovery = swarm.join(topic, {server: true, client: true});

        await discovery.flushed();

        return domain;
    }
}

module.exports = Protocol;
