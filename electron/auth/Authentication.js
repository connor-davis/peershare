const { hashSync, genSaltSync } = require('bcrypt');
const crypto = require('crypto-js');
const { writeFileSync, existsSync, readFileSync, mkdirSync } = require('fs');
const path = require('path');
const { v4 } = require('uuid');

class Authentication {
  constructor() {
    this.dataDirectory = path.join(process.cwd(), 'data');
    this.usersDirectory = path.join(process.cwd(), 'data', 'users');
    this.user = {};

    if (!existsSync(this.dataDirectory)) mkdirSync(this.dataDirectory);
    if (!existsSync(this.usersDirectory)) mkdirSync(this.usersDirectory);
  }

  updateUser(data, password) {
    const userPackFilePath = path.join(this.usersDirectory, username + '.pack');

    if (!existsSync(userPackFilePath)) return false;
    else {
      const userPackFile = readFileSync(userPackFilePath, {
        encoding: 'utf-8',
      });
      const decData = crypto.AES.decrypt(userPackFile, password).toString(
        crypto.enc.Utf8
      );

      if (!decData) return false;

      const encData = crypto.AES.encrypt(
        JSON.stringify(data),
        password
      ).toString();
      const userPackFilePath = path.join(
        this.usersDirectory,
        username + '.pack'
      );

      writeFileSync(
        path.join(this.usersDirectory, username + '.pack'),
        encData,
        {
          encoding: 'utf-8',
        }
      );

      this.user = data;

      return true;
    }
  }

  login(username, password) {
    const userPackFilePath = path.join(this.usersDirectory, username + '.pack');

    if (!existsSync(userPackFilePath)) return false;
    else {
      const userPackFile = readFileSync(userPackFilePath, {
        encoding: 'utf-8',
      });
      const decData = crypto.AES.decrypt(userPackFile, password).toString(
        crypto.enc.Utf8
      );

      if (!decData) return false;

      this.user = JSON.parse(decData);

      return true;
    }
  }

  register(username, password) {
    const userId = v4();
    const data = {
      userId,
      username,
    };
    const encData = crypto.AES.encrypt(
      JSON.stringify(data),
      password
    ).toString();
    const userPackFilePath = path.join(this.usersDirectory, username + '.pack');

    if (existsSync(userPackFilePath)) return false;
    else {
      writeFileSync(
        path.join(this.usersDirectory, username + '.pack'),
        encData,
        {
          encoding: 'utf-8',
        }
      );

      this.user = data;

      return true;
    }
  }
}

module.exports = Authentication;
