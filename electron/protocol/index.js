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
        this.files = new Set([]);
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
            if (this.peerCount > 0) {
                information.backoff();
                connection.destroy();
            }

            if (information.type === 'utp') {
                information.backoff();
                connection.destroy();
            }

            this.connections.push(connection);

            this.peerCount = this.peerCount + 1;

            this.events.next({type: "peer-count", count: this.peerCount});

            connection.on("data", (data) =>
                this.events.next(JSON.parse(data.toString()))
            );

            this.events.subscribe((event) => {
                if (event.type === "local-message") {
                    reply("message", {type: "local-message", content: event.content});
                    connection.write(JSON.stringify({type: "remote-message", content: event.content}));
                }

                if (event.type === "remote-message") {
                    this.messages.push({ type: "remote-message", content: event.content });
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

                if (event.type === "remote-file-added") return this.addFile(event.file, false, reply);
                if (event.type === "remote-file-removed") return this.removeFile(event.file, false, reply);

                if (event.type === "download-file") return connection.write(JSON.stringify({
                    type: "request-download",
                    key: event.key
                }));

                if (event.type === "request-download") {
                    const {key} = event;
                    const size = statSync(key).size;

                    const node = new UploadNode(key, size);

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

                if (event.type === "upload-ready") {
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
        this.messages.push({ type: "local-message", content: message });
        this.events.next({type: "local-message", content: message});
    }

    getMessages() {
        return this.messages;
    }

    addFile(file, forRemote = true, reply = (event, data) => {
    }) {
        file = {...file, remote: !forRemote};

        this.files.add(file);

        if (forRemote) this.events.next({type: "local-file-added", file: {...file, remote: forRemote}});
        else reply("file-list", this.files);

        return file;
    }

    removeFile(file, forRemote = true, reply = (event, data) => {
    }) {
        this.files = new Set([...this.files].filter((el) => el.path !== file.path));

        if (forRemote) this.events.next({type: "local-file-removed", file});
        else reply("file-list", this.files);

        return file;
    }
}

module.exports = Protocol;
