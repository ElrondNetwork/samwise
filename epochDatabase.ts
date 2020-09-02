var level = require("level");
import path = require("path");
import { MiniblockMetadata } from "./src/miniblockMetadata";
import { PayloadDbOptions } from "./src/shared";
import { MetaBlock } from "./src/metaBlock";

export class EpochDatabase {
    private readonly epoch: number;
    private readonly dbpath: string;
    private readonly shard: string;

    private miniblocksMetadataDb: any;
    private metaBlocksDb: any;

    private transactionsDb: any;
    private unsignedDb: any;
    private rewardsDb: any;

    // Useful for "has()" questions.
    private metaBlocksKeys: string[] = [];

    constructor(epoch: number, dbpath: string, shard: string) {
        this.epoch = epoch;
        this.dbpath = dbpath;
        this.shard = shard;
    }

    async open() {
        let root = path.join(this.dbpath, `Shard_${this.shard}`);

        this.miniblocksMetadataDb = await level(path.join(root, "DbLookupExtensions", "MiniblocksMetadata"), PayloadDbOptions);
        this.metaBlocksDb = await level(path.join(root, "MetaBlock"), PayloadDbOptions);

        this.transactionsDb = await level(path.join(root, "Transactions"), PayloadDbOptions);
        this.unsignedDb = await level(path.join(root, "UnsignedTransactions"), PayloadDbOptions);
        this.rewardsDb = await level(path.join(root, "RewardTransactions"), PayloadDbOptions);

        this.metaBlocksKeys = await this.getKeys(this.metaBlocksDb);
    }

    async close() {
        await this.miniblocksMetadataDb.close();
        await this.metaBlocksDb.close();

        await this.transactionsDb.close();
        await this.unsignedDb.close();
        await this.rewardsDb.close();
    }

    async getMiniblockMetadata(hash: string): Promise<MiniblockMetadata> {
        let buffer = await this.miniblocksMetadataDb.get(hash);
        let result = MiniblockMetadata.fromBuffer(buffer);
        result.hash = hash;
        return result;
    }

    async getTxHashes(): Promise<string[]> {
        return await this.getKeys(this.transactionsDb);
    }

    async getUnsignedHashes(): Promise<string[]> {
        return await this.getKeys(this.unsignedDb);
    }

    async getRewardsHashes(): Promise<string[]> {
        return await this.getKeys(this.rewardsDb);
    }

    private async getKeys(db: any): Promise<string[]> {
        let result = [];
        let stream = db.createReadStream({ keys: true, values: false });

        for await (const data of stream) {
            let hash: any = data;
            result.push(hash);
        }

        return result;
    }

    containsMetaBlock(hash: string): boolean {
        return this.metaBlocksKeys.includes(hash);
    }

    async getMetaBlock(hash: string): Promise<MetaBlock> {
        let buffer = await this.metaBlocksDb.get(hash);
        let result = MetaBlock.fromBuffer(buffer);
        return result;
    }
}