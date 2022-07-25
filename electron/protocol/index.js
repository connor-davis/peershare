const HyperSwarm = require('hyperswarm');
const { Subject } = require('rxjs');
const { statSync } = require('fs');
const UploadNode = require('./UploadNode');
const DownloadNode = require('./DownloadNode');

class Protocol {
  constructor(reply) {
    this.reply = reply;
    this.domain = "";
    this.sharingSwarm = undefined;
    this.messagingSwarm = undefined;
    this.peerCount = 0;
    this.connections = [];
    this.messages = [];
    this.files = [];
    this.events = new Subject();
  }

  async createSharingSwarm(domain) {
    this.peerCount = 0;

    console.log('Creating sharing swarm on - ' + domain);

    this.domain = domain;
    this.sharingSwarm = new HyperSwarm();

    process.once('SIGINT', function () {
      this.sharingSwarm.once('close', function () {
        process.exit();
      });
      this.sharingSwarm.destroy();
      setTimeout(() => process.exit(), 2000);
    });

    this.sharingSwarm.on('connection', (connection, information) => {
      this.connections.push(connection);
      this.peerCount = this.peerCount + 1;
    });

    this.topic = Buffer.alloc(32).fill(domain);
    this.discovery = this.sharingSwarm.join(this.topic, {
      server: true,
      client: true,
    });

    await this.discovery.flushed();

    return this.topic;
  }

  async killSharingSwarm() {
    if (this.sharingSwarm) {
      return new Promise(async (resolve, reject) => {
        this.connections.forEach((connection) =>
          connection.write(JSON.stringify({ type: 'disconnect' }))
        );

        await this.sharingSwarm.leave(this.topic);
        await this.discovery.destroy();
        await this.sharingSwarm.destroy();

        this.peerCount = 0;

        console.log('Leaving sharing swarm on - ' + this.domain);

        resolve(this.peerCount);
      });
    }
  }

  async createMessagingSwarm(domain) {
    console.log('Creating messaging swarm on - ' + domain);

    this.domain = domain;
    this.messagingSwarm = new HyperSwarm();

    process.once('SIGINT', function () {
      this.messagingSwarm.once('close', function () {
        process.exit();
      });
      this.messagingSwarm.destroy();
      setTimeout(() => process.exit(), 2000);
    });

    this.messagingSwarm.on('connection', (connection, information) => {

    });

    this.topic = Buffer.alloc(32).fill(domain);
    this.discovery = this.messagingSwarm.join(this.topic, {
      server: true,
      client: true,
    });

    await this.discovery.flushed();

    return this.topic;
  }

  async killMessagingSwarm() {
    if (this.messagingSwarm) {
      return new Promise(async (resolve, reject) => {
        this.connections.forEach((connection) =>
          connection.write(JSON.stringify({ type: 'disconnect' }))
        );

        await this.messagingSwarm.leave(this.topic);
        await this.discovery.destroy();
        await this.messagingSwarm.destroy();

        console.log('Leaving messaging swarm on - ' + this.domain);

        resolve();
      });
    }
  }
}

module.exports = Protocol;
