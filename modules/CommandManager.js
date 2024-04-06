import readline from 'readline';
export class CommandManager {
    interface;
    app;
    constructor(app) {
        this.app = app;
        this.interface = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.initializeEvents();
    }
    initializeEvents() {
        this.interface.on("line", function (e) {
        });
    }
}
