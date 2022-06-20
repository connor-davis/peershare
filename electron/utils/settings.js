const {
  existsSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  write,
} = require('fs');
const path = require('path');

class Settings {
  constructor() {
    this.dataDirectory = path.join(process.cwd(), 'data');
    this.settingsFilePath = path.join(process.cwd(), 'data', 'settings.json');
    this.settings = {};

    if (!existsSync(this.dataDirectory)) mkdirSync(this.dataDirectory);

    if (!existsSync(this.settingsFilePath))
      writeFileSync(this.settingsFilePath, JSON.stringify({}), {
        encoding: 'utf-8',
      });
  }

  loadSettings() {
    this.settings = JSON.parse(
      readFileSync(this.settingsFilePath, { encoding: 'utf-8' })
    );
  }

  saveSettings() {
    writeFileSync(this.settingsFilePath, JSON.stringify(this.settings), {
      encoding: 'utf-8',
    });
  }

  put(key, value) {
    this.settings[key] = value;
  }

  get(key) {
    return this.settings[key];
  }
}

module.exports = Settings;
