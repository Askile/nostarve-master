import http from "http";
import express from "express";
import fs from "fs";
import { Settings } from "./modules/Settings.js";
import { Account } from "./modules/Account.js";
import { SkinType } from "./enums/SkinType.js";
import { COSMETICS, Rarity } from "./enums/Rarity.js";
import { Constants } from "./modules/Constants.js";
import { Utils } from "./modules/Utils.js";
import { IP } from "./modules/IP.js";
import * as path from "path";
import * as url from "url";
// 2023 code, i lazy to change it
export class App {
    port;
    app;
    server;
    accounts;
    ips;
    serverData;
    constructor(port) {
        this.port = port;
        this.app = express();
        this.app.use(express.json());
        this.server = http.createServer(this.app);
        this.ips = new Map();
        this.serverData = JSON.parse(fs.readFileSync('./frontend/servers.json', { encoding: "utf-8" }));
        this.accounts = JSON.parse(fs.readFileSync("./JSON/accounts.json", { encoding: "utf-8" }));
        this.run();
        this.setupRoutes();
        this.setupPrivateRoutes();
    }
    setupPrivateRoutes() {
        this.app.put("/updatePlayerCount", this.updatePlayerCount.bind(this));
        this.app.put("/updateAccountData", this.updateAccountData.bind(this));
    }
    setupRoutes() {
        this.app.set("trust proxy", true);
        this.app.get("/buySpin", this.onBuySpin.bind(this));
        // this.app.get("/buyKit", this.onBuyKit.bind(this));
        this.app.post("/login", this.onLogin.bind(this));
        this.app.post("/register", this.onRegister.bind(this));
        this.app.get("/servers", (req, res) => {
            const address = req.ip;
            if (!this.ips.has(address)) {
                this.ips.set(address, new IP(address));
            }
            return res.send(JSON.stringify(this.serverData));
        });
        this.app.get("/leaderboard", this.onGetLeaderboard.bind(this));
        this.app.get("/getBreadAndScore", this.onGetBreadAndScore.bind(this));
    }
    onRegister(req, res) {
        const address = (req.headers['x-forwarded-for'] || req.socket.remoteAddress);
        let ip = this.ips.get(address);
        if (ip) {
            if (ip.account)
                return res.status(403).send(`U already have an account ${ip.account.name}`);
            if (Date.now() - ip.firstJoined <= 30000)
                return res.status(403).send(`Ur ip must be registered on site ${30 - Math.floor(Math.abs(ip.firstJoined - Date.now()) / 1000)} seconds to interact with accounts`);
        }
        else
            return res.status(403);
        const { login, password } = req.body;
        if (typeof req.body !== "object" ||
            login?.length < 4 || password?.length < 4 ||
            login?.length > 16 || password?.length > 16)
            return res.status(400).send();
        if (this.accounts[login] !== undefined)
            return res.status(400).send("That login taken");
        this.accounts[login] = new Account(login, password);
        ip.account = this.accounts[login];
        fs.writeFileSync("./JSON/accounts.json", JSON.stringify(this.accounts));
        res.send(JSON.stringify(this.accounts[login]));
    }
    onLogin(req, res) {
        const { login, password } = req.body;
        const account = this.accounts[login];
        if (typeof req.body !== "object" ||
            login?.length < 4 || password?.length < 4 ||
            login?.length > 16 || password?.length > 16)
            return res.status(400).send();
        if (account === undefined)
            return res.status(400).send("That login doesn't exist");
        if (account.password !== password)
            return res.status(400).send("Wrong password");
        fs.writeFileSync("./JSON/accounts.json", JSON.stringify(this.accounts));
        if (account.kit)
            account.kit = Math.max((account.kitStamp - Date.now()), 0);
        res.send(this.accounts[login]);
    }
    onGetBreadAndScore(req, res) {
        const { login } = req.query;
        const account = this.accounts[login];
        if (!account)
            return res.status(429).send();
        res.send(JSON.stringify({ s: account.seasons[0].score, b: account.bread }));
    }
    onGetLeaderboard(req, res) {
        const { mode, sort, season, range } = req.query;
        if (!mode || !sort)
            return res.status(429).send();
        const leaderboard = [];
        const accounts = Object.values(this.accounts);
        for (let i = 0; i < Math.min(200, accounts.length); i++) {
            const account = accounts[i];
            const { score, kill, time } = account.seasons[Settings.season];
            leaderboard.push([account.name, score, time, kill, score]);
        }
        const index = sort === "score" ? 1 : sort === "time" ? 2 : sort === "kill" ? 3 : 1;
        const lb = leaderboard.sort((a, b) => b[index] - a[index]);
        res.send(lb);
    }
    onBuyKit(req, res) {
        const { login, password, kit } = req.query;
        const account = this.accounts[login];
        const price = (kit === "0" ? 300 : 600);
        if (!login || !password || !kit || account.password !== password || account.bread - price < 0) {
            return res.status(429).send();
        }
        account.kit += (kit === "0" ? Constants.HOUR : Constants.DAY);
        account.kitStamp = Date.now() + account.kit;
        account.bread -= price;
        res.send(JSON.stringify(account.kit));
    }
    onBuySpin(req, res) {
        const { login, password, spin } = req.query;
        const account = this.accounts[login];
        if (!login || !password || !spin || !account || account.password !== password) {
            return res.status(429).send();
        }
        const spinId = Number(spin);
        const price = (spinId === 0 ? 100 :
            spinId === 1 ? 300 :
                spinId === 2 ? 600 :
                    spinId === 3 ? 50 :
                        spinId === 4 ? 150 :
                            spinId === 5 ? 300 : 600);
        if (account.bread - price < 0) {
            return res.status(429).send();
        }
        for (let i = 0; i < 50; i++) {
            const rand = Math.random();
            const offset = (rand > 0.47 ? 0 :
                rand > 0.13 ? 1 :
                    rand > 0.03 ? 2 : 3) + spinId % 3;
            let type = (spinId < 3 ? SkinType.SKIN : Math.ceil(Math.random() * 4));
            const unlockedAllAccessories = account.accessories.findIndex(skin => skin !== null) === -1;
            const unlockedAllSkins = account.skins.findIndex(skin => skin !== null) === -1;
            const unlockedAllBags = account.bags.findIndex(skin => skin !== null) === -1;
            if (unlockedAllAccessories && unlockedAllSkins && unlockedAllBags) {
                type = 0;
            }
            const skins = COSMETICS[SkinType[type]].filter((skin) => skin.rarity === Rarity.WOOD + offset);
            const skin = skins[Math.floor(Math.random() * skins.length)];
            const id = skin.id;
            switch (type) {
                case SkinType.SKIN:
                    if (account.skins[id] === null) {
                        account.skins[id] = 1;
                        account.bread -= price;
                        return res.send({ rand, type, id });
                    }
                    break;
                case SkinType.ACCESSORY:
                    if (account.accessories[id] === null) {
                        account.accessories[id] = 1;
                        account.bread -= price;
                        return res.send({ rand, type, id });
                    }
                    break;
                case SkinType.BAG:
                    if (account.bags[id] === null) {
                        account.bags[id] = 1;
                        account.bread -= price;
                        return res.send({ rand, type, id });
                    }
                    break;
                case SkinType.BOOK:
                    if (account.books[id] === null) {
                        account.books[id] = 1;
                        account.bread -= price;
                        return res.send({ rand, type, id });
                    }
                    break;
                case SkinType.CRATE:
                    if (account.crates[id] === null) {
                        account.crates[id] = 1;
                        account.bread -= price;
                        return res.send({ rand, type, id });
                    }
                    break;
            }
            fs.writeFileSync("./JSON/accounts.json", JSON.stringify(this.accounts));
        }
        return res.status(429).send();
    }
    updatePlayerCount(req, res) {
        const { c, d, p } = req.body;
        const server = this.serverData.find((s) => s.i === d);
        if (!Number.isInteger(c) || p !== Settings.password || !server)
            return;
        server.nu = c;
    }
    updateAccountData(req, res) {
        const { l, s, k, t, p, e } = req.body;
        const account = this.accounts[l];
        if (!account || p !== Settings.password)
            return;
        const oldLevel = Utils.levelFormula(account.seasons[0].score);
        account.seasons[0].score += (Number(s) * Number(e)) ?? 0;
        account.seasons[0].kill += Number(k) ?? 0;
        account.seasons[0].time += Number(t) ?? 0;
        const newLevel = Utils.levelFormula(account.seasons[0].score);
        let reward = 0;
        for (let i = oldLevel + 1; i < newLevel + 1; i++) {
            reward += i * 100;
        }
        account.bread += Math.min(Math.floor(Number(s) / 1000), 600) + Math.floor(reward);
        res.end();
    }
    run() {
        this.app.get("/js/client.min.js", (req, res) => {
            res.sendFile(path.dirname(url.fileURLToPath(import.meta.url)) + "/data/client.js");
        });
        this.app.use(express.static("frontend"));
        this.server.listen(this.port);
    }
}
import { Worker, isMainThread } from 'worker_threads';
if (isMainThread) {
    const worker = new Worker('./obfuscator/obfuscator.js');
    worker.on('error', (error) => {
        console.error('Error in Worker:', error);
    });
    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error('Worker finished with exit code:', code);
        }
    });
    worker.postMessage("minify");
    setInterval(() => {
        worker.postMessage("minify");
    }, 60000);
}
new App(80);
