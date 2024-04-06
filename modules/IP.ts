import { Account } from "./Account.js";

export class IP {
    public address: string;
    public firstJoined: number;
    public account: Account | undefined;
    public constructor(address: string) {
        this.address = address;
        this.firstJoined = Date.now();
        this.account = undefined;
    }
}