import { MetaBlockMessage } from "./proto";
import { ProtoToObjectOptions } from "./shared";

export class MetaBlock {
    nonce: number = 0;
    epoch: number = 0;
    round: number = 0;
    notarizedBlocks: ShardData[] = [];

    constructor() {
    }

    static fromBuffer(buffer: Buffer): MetaBlock {
        let result = new MetaBlock();
        let message: any = MetaBlockMessage.decode(buffer);
        let object = MetaBlockMessage.toObject(message, ProtoToObjectOptions);

        result.nonce = object.Nonce;
        result.round = object.Round;
        result.epoch = object.Epoch;
        result.notarizedBlocks = object.ShardInfo.map((item: any) => ShardData.fromProtoObject(item));

        return result;
    }

    containsMiniblock(hash: string): boolean {
        return this.notarizedBlocks.some(item => item.containsMiniblock(hash));
    }
}

export class ShardData {
    nonce: number = 0;
    headerHash: string = "";
    shard: number = 0;
    miniblocks: MiniblockHeader[] = [];

    static fromProtoObject(object: any): ShardData {
        let result = new ShardData();

        result.nonce = object.Nonce;
        result.shard = object.ShardID;
        result.headerHash = object.HeaderHash.toString("hex");
        result.miniblocks = object.ShardMiniBlockHeaders.map((item: any) => MiniblockHeader.fromProtoObject(item));

        return result;
    }

    containsMiniblock(hash: string): boolean {
        return this.miniblocks.some(item => item.hash == hash);
    }
}

export class MiniblockHeader {
    hash: string = "";
    senderShard: number = 0;
    receiverShard: number = 0;
    type: string = "";

    static fromProtoObject(object: any): MiniblockHeader {
        let result = new MiniblockHeader();

        result.hash = object.Hash.toString("hex");
        result.senderShard = object.SenderShardID;
        result.receiverShard = object.ReceiverShardID;
        result.type = object.Type;

        return result;
    }
}
