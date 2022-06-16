const HyperSwarm = require("hyperswarm");
const {Subject} = require('rxjs');
const {statSync} = require("fs");
const UploadNode = require("./UploadNode");
const DownloadNode = require("./DownloadNode");

class Protocol {
    constructor(reply) {
        this.reply = reply;
        this.peerCount = 0;
        this.connections = [];
        this.messages = [];
        this.files = [];
        this.events = new Subject();
    }

    async createSwarm(domain, reply = (event, data) => {
    }) {
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
            this.connections.push(connection);

            this.peerCount = this.peerCount + 1;

            this.events.next({type: "peer-count", count: this.peerCount});

            this.connections[0].write(JSON.stringify({type: "get-remote-files"}));

            connection.on("data", (data) =>
                this.events.next(JSON.parse(data.toString()))
            );

            this.events.subscribe((event) => {
                if (event.type === "get-remote-files") return connection.write(JSON.stringify({
                    type: "file-list",
                    files: this.files.map((file) => {
                        delete file.remote;

                        return file;
                    })
                }));

                if (event.type === "file-list") {
                    this.files = new Set([...this.files, ...event.files]
                        .map((file) => {
                            if (file.owner !== Buffer.from(this.swarm.keyPair.publicKey).toString("hex")) return {
                                ...file,
                                remote: true
                            };
                            else return file;
                        }).map(JSON.stringify));

                    this.files = Array.from(this.files).map(JSON.parse);

                    reply("file-list", this.files);
                }

                if (event.type === "local-message") {
                    reply("message", {type: "local-message", content: event.content});
                    connection.write(JSON.stringify({type: "remote-message", content: event.content}));
                }

                if (event.type === "remote-message") {
                    this.messages.push({type: "remote-message", content: event.content});
                    reply("message", {type: "remote-message", content: event.content});
                }

                if (event.type === "disconnect") {
                    if (this.peerCount === 0) {
                        this.files = new Set([]);

                        reply("file-list", this.files);
                    }

                    if (this.peerCount > 0) {
                        this.peerCount = this.peerCount - 1;

                        this.events.next({type: "peer-count", count: this.peerCount});

                        this.connections = this.connections.filter((old) => old !== connection);
                    }

                    connection.end();
                    connection.destroy();

                    return;
                }

                if (event.type === "local-file-added") return connection.write(JSON.stringify({
                    ...event,
                    type: "remote-file-added"
                }));

                if (event.type === "local-file-removed") return connection.write(JSON.stringify({
                    ...event,
                    type: "remote-file-removed"
                }));

                if (event.type === "remote-file-added") return this.addRemoteFile(event.file, reply);
                if (event.type === "remote-file-removed") return this.removeRemoteFile(event.file, reply);

                if (event.type === "download-file") return connection.write(JSON.stringify({
                    type: "request-download",
                    key: event.key,
                    owner: event.owner,
                    requester: Buffer.from(this.swarm.keyPair.publicKey).toString("hex")
                }));

                if (event.type === "request-download" && event.owner === Buffer.from(this.swarm.keyPair.publicKey).toString("hex")) {
                    const {key} = event;
                    const size = statSync(key).size;

                    const node = new UploadNode(key, event.requester, size);

                    node.events.subscribe((nodeEvent) => {
                        if (nodeEvent.type === "progress") return reply("progress", {
                            upload: {
                                progress: nodeEvent.progress.percentage,
                                eta: nodeEvent.progress.eta,
                                speed: nodeEvent.progress.speed
                            },
                            key,
                        });
                        if (nodeEvent.type === "file-uploaded") return reply("complete", {
                            key,
                            upload: true,
                            download: false
                        });
                        if (nodeEvent.type === "upload-ready") {
                            reply("started", {
                                key,
                                upload: true,
                                download: false
                            });
                            return connection.write(JSON.stringify(nodeEvent));
                        }
                    });

                    return;
                }

                if (event.type === "upload-ready" && event.requester === Buffer.from(this.swarm.keyPair.publicKey).toString("hex")) {
                    const {key, size} = event;

                    const node = new DownloadNode(key, size);

                    reply("started", {
                        key,
                        upload: false,
                        download: true
                    });

                    node.events.subscribe((nodeEvent) => {
                        if (nodeEvent.type === "progress") return reply("progress", {
                            download: {
                                progress: nodeEvent.progress.percentage,
                                eta: nodeEvent.progress.eta,
                                speed: nodeEvent.progress.speed
                            },
                            key,
                        });
                        if (nodeEvent.type === "file-downloaded") return reply("complete", {
                            key,
                            upload: false,
                            download: true
                        });
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
            this.connections.forEach((connection) => connection.write(JSON.stringify({type: "disconnect"})));

            await this.swarm.leave(this.topic);
            await this.discovery.destroy();
            await this.swarm.destroy();

            this.peerCount = 0;

            console.log('Leaving swarm on - ' + this.domain);

            resolve(this.peerCount);
        });
    }

    sendMessage(message) {
        this.messages.push({type: "local-message", content: message});
        this.events.next({type: "local-message", content: message});
    }

    getMessages() {
        return this.messages;
    }

    addLocalFile(file, reply = (event, data) => {
    }) {
        file = {...file, owner: Buffer.from(this.swarm.keyPair.publicKey).toString("hex")};

        this.files.push(file);

        this.files = new Set(this.files.map(JSON.stringify));
        this.files = Array.from(this.files).map(JSON.parse);

        this.events.next({type: "local-file-added", file});
        reply("file-list", this.files);

        return file;
    }

    removeLocalFile(file, reply = (event, data) => {
    }) {
        this.files = this.files.filter((el) => el.path !== file.path);

        this.events.next({type: "local-file-removed", file});
        reply("file-list", this.files);

        return file;
    }

    addRemoteFile(file, reply = (event, data) => {
    }) {
        file = {...file, remote: true};

        this.files.push(file);

        this.files = new Set(this.files.map(JSON.stringify));
        this.files = Array.from(this.files).map(JSON.parse);

        reply("file-list", this.files);

        return file;
    }

    removeRemoteFile(file, reply = (event, data) => {
    }) {
        this.files = this.files.filter((el) => el.path !== file.path);

        reply("file-list", this.files);

        return file;
    }
}

module.exports = Protocol;
