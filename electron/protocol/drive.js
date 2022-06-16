const HyperDrive = require("hyperdrive");
const path = require("path");

// TODO
class Drive {
    constructor(name) {
        this.name = name;
        this.drive = new HyperDrive(path.join(process.cwd(), "drives", this.name));
    }

    async directoriesAt(path) {
        return await this.drive.promises.readdir(path);
    }

    async mkdirAt(path, directoryName) {
        return await this.drive.promises.mkdir(path + directoryName);
    }

    async readFile(path) {
        return await this.drive.promises.readFile(path, "utf-8");
    }

    async writeFile(path) {}
}