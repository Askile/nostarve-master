import readline from 'readline';
import { App } from '../app.js';

export class CommandManager {
    private interface: readline.Interface;
    private app: App;
    constructor(app: App) {
        this.app = app;
        this.interface = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.initializeEvents();
    }

    private initializeEvents() {
        this.interface.on("line", function(e) {
            
        });
    }
}