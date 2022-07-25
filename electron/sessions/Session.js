const { hashSync, genSaltSync } = require('bcrypt');
const { existsSync, mkdirSync, writeFileSync, readFileSync } = require('fs');
const path = require('path');
const { Subject } = require('rxjs');
const Protocol = require('../protocol');

class Session {
  constructor(sessionName) {
    this.dataDirectory = path.join(process.cwd(), 'data');
    this.sessionsDirectory = path.join(process.cwd(), 'data', 'sessions');
    this.events = new Subject();
    this.sessionData = {
      sessionName,
    };
    this.sessionFilePath = path.join(
      process.cwd(),
      'data',
      'sessions',
      this.sessionData.sessionName + '.json'
    );

    if (!existsSync(this.dataDirectory)) mkdirSync(this.dataDirectory);
    if (!existsSync(this.sessionsDirectory)) mkdirSync(this.sessionsDirectory);
    if (!existsSync(this.sessionFilePath))
      writeFileSync(this.sessionFilePath, JSON.stringify({}), {
        encoding: 'utf-8',
      });

    this.protocol = new Protocol((event, data) =>
      this.events.next({ type: event, ...data })
    );

    this.protocol.createSharingSwarm(this.sessionData.sessionName + "-sharing");
    this.protocol.createMessagingSwarm(this.sessionData.sessionName + "-messaging");
  }

  loadSessionData() {
    this.sessionData = {
      ...this.sessionData,
      ...JSON.parse(
        readFileSync(this.sessionFilePath, {
          encoding: 'utf-8',
        })
      ),
    };
  }

  saveSessionData() {
    writeFileSync(this.sessionFilePath, JSON.stringify(this.sessionData), {
      encoding: 'utf-8',
    });
  }
}

module.exports = Session;
