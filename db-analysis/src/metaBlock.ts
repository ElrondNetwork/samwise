import { MetaBlockMessage } from "./proto";
import { ProtoToObjectOptions } from "./shared";

export class MetaBlock {
    nonce: number = 0;
    epoch: number = 0;
    round: number = 0;
    notarizedBlocks: ShardData[] = [];
    miniblockHeaders: MiniblockHeader[] = [];

    constructor() {
    }

    static fromBuffer(buffer: Buffer): MetaBlock {
        let result = new MetaBlock();
        let message: any = MetaBlockMessage.decode(buffer);
        let object = MetaBlockMessage.toObject(message, ProtoToObjectOptions);

        // let economics = object.EpochStart.Economics;
        // console.log(economics);
        // console.log("TotalSupply:", economics.TotalSupply.toString("hex"));
        // console.log("TotalToDistribute:", economics.TotalToDistribute.toString("hex"));
        // console.log("TotalNewlyMinted:", economics.TotalNewlyMinted.toString("hex"));
        // console.log("RewardsPerBlock:", economics.RewardsPerBlock.toString("hex"));
        // console.log("RewardsForProtocolSustainability:", economics.RewardsForProtocolSustainability.toString("hex"));
        // console.log("NodePrice:", economics.NodePrice.toString("hex"));
     

        result.nonce = object.Nonce;
        result.round = object.Round;
        result.epoch = object.Epoch;
        result.notarizedBlocks = object.ShardInfo.map((item: any) => ShardData.fromProtoObject(item));
        result.miniblockHeaders = object.MiniBlockHeaders.map((item: any) => MiniblockHeader.fromProtoObject(item));

        return result;
    }

    containsMiniblock(hash: string): boolean {
        let inNotarizedBlocks = this.notarizedBlocks.some(item => item.containsMiniblock(hash));
        let inMiniblockHeaders = this.miniblockHeaders.some(item => item.hash == hash);
        return inNotarizedBlocks || inMiniblockHeaders;
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
