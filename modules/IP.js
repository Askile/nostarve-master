export class IP {
    address;
    firstJoined;
    account;
    constructor(address) {
        this.address = address;
        this.firstJoined = Date.now();
        this.account = undefined;
    }
}
