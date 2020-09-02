import { EpochByHashMessage } from "./proto";

export class Epoch {
    private value: number;

    constructor(value: number) {
        this.value = value;
    }

    static fromBuffer(buffer: Buffer): Epoch {
        let message: any = EpochByHashMessage.decode(buffer);
        return new Epoch(message.Epoch);
    }

    get(): number {
        return this.value;
    }
}