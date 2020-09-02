import { TxMessage, RewardTxMessage, ScrMessage } from "./proto";
import { ProtoToObjectOptions } from "./shared";

export class Transaction {
    nonce: number = 0;
    sender: string = "";
    receiver: string = "";
    data: string = "";

    constructor() {
    }

    static fromBuffer(buffer: Buffer): Transaction {
        let result = new Transaction();
        let message: any = TxMessage.decode(buffer);
        let object = TxMessage.toObject(message, ProtoToObjectOptions);
        result.populateFromProtoObject(object);

        return result;
    }

    protected populateFromProtoObject(object: any) {
        this.nonce = object.Nonce;
        this.sender = object.SndAddr?.toString("hex");
        this.receiver = object.RcvAddr?.toString("hex");
        this.data = object.Data?.toString("base64");
    }
}

export class RewardTransaction extends Transaction {
    epoch: number = 0;

    constructor() {
        super();
    }

    static fromBuffer(buffer: Buffer): RewardTransaction {
        let result = new RewardTransaction();
        let message: any = RewardTxMessage.decode(buffer);
        let object = RewardTxMessage.toObject(message, ProtoToObjectOptions);
        result.populateFromProtoObject(object);

        return result;
    }

    protected populateFromProtoObject(object: any) {
        super.populateFromProtoObject(object);
        this.epoch = object.Epoch;
    }
}

export class UnsignedTransaction extends Transaction {
    returnMessage: string = "";

    constructor() {
        super();
    }

    static fromBuffer(buffer: Buffer): UnsignedTransaction {
        let result = new UnsignedTransaction();
        let message: any = ScrMessage.decode(buffer);
        let object = ScrMessage.toObject(message, ProtoToObjectOptions);
        result.populateFromProtoObject(object);

        return result;
    }

    protected populateFromProtoObject(object: any) {
        super.populateFromProtoObject(object);
        this.returnMessage = object.ReturnMessage.toString("base64");
    }
}
