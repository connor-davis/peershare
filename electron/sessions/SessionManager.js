const { readdirSync, existsSync, mkdirSync } = require('fs');
const Session = require('./Session');
const path = require('path');
const { Subject } = require('rxjs');

class SessionManager {
  constructor() {
    this.dataDirectory = path.join(process.cwd(), 'data');
    this.sessionsDirectory = path.join(process.cwd(), 'data', 'sessions');
    this.events = new Subject();
    this.sessions = [];

    if (!existsSync(this.dataDirectory)) mkdirSync(this.dataDirectory);
    if (!existsSync(this.sessionsDirectory)) mkdirSync(this.sessionsDirectory);
  }

  loadSessions() {
    readdirSync(this.sessionsDirectory).forEach((sessionFilePath) => {
      const parts = sessionFilePath.split('\\');
      const sessionName = parts[parts.length - 1].split('.')[0];

      console.log('Loading ' + sessionName + ' session.');

      const session = new Session(sessionName);

      session.loadSessionData();

      this.sessions.push(session);
    });
  }

  saveSessions() {
    this.sessions.forEach((session) => {
      console.log('Saving ' + session.sessionData.sessionName + ' session.');
      session.saveSessionData();
    });
  }
}

module.exports = SessionManager;
