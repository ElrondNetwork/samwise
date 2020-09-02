import { ProtoToObjectOptions } from "./shared";
import { MiniblockMetadataMessage } from "./proto";

export class MiniblockMetadata {
    hash: string = "";

    sourceShard: number = 0;
    destinationShard: number = 0;
    round: number = 0;
    epoch: number = 0;
    type: number = 0;
    miniblockHash: string = "";

    notarizedAtSourceInMetaNonce: number = 0;
    notarizedAtDestinationInMetaNonce: number = 0;
    notarizedAtSourceInMetaHash: string = "";
    notarizedAtDestinationInMetaHash: string = "";

    constructor() {
    }

    static fromBuffer(buffer: Buffer): MiniblockMetadata {
        let result = new MiniblockMetadata();
        let message: any = MiniblockMetadataMessage.decode(buffer);
        let object = MiniblockMetadataMessage.toObject(message, ProtoToObjectOptions); 

        result.sourceShard = object.SourceShardID;
        result.destinationShard = object.DestinationShardID;
        result.round = object.Round;
        result.epoch = object.Epoch;
        result.type = object.Type;
        result.miniblockHash = object.MiniblockHash.toString("hex");

        result.notarizedAtSourceInMetaNonce = object.NotarizedAtSourceInMetaNonce;
        result.notarizedAtDestinationInMetaNonce = object.NotarizedAtDestinationInMetaNonce;
        result.notarizedAtSourceInMetaHash = object.NotarizedAtSourceInMetaHash.toString("hex");
        result.notarizedAtDestinationInMetaHash = object.NotarizedAtDestinationInMetaHash.toString("hex");

        return result;
    }

    hasIssues(): boolean {
        let hasSource = this.notarizedAtSourceInMetaNonce > 0;
        let hasDestination = this.notarizedAtDestinationInMetaNonce > 0;
        if (!hasSource || !hasDestination) {
            return true;
        }

        return false;
    }

    hasCriticalIssue(): boolean {
        let hasDestination = this.notarizedAtDestinationInMetaNonce > 0;
        return !hasDestination;
    }
}
