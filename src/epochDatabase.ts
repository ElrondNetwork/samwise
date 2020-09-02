var level = require("level");
import path = require("path");
import { MiniblockMetadata } from "./miniblockMetadata";
import { PayloadDbOptions, onLevelErrorGet } from "./shared";
import { MetaBlock } from "./metaBlock";
import { Transaction, UnsignedTransaction, RewardTransaction } from "./transactions";

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

    async getAnyTxHashes(): Promise<string[]> {
        let normal = await this.getTxHashes();
        let unsigned = await this.getUnsignedHashes();
        let rewards = await this.getRewardsHashes();
        return normal.concat(unsigned).concat(rewards);
    }

    async getAnyTx(hash: string): Promise<any> {
        return await this.getTx(hash) || await this.getUnsignedTx(hash) || await this.getRewardTx(hash);
    }

    async getTx(hash: string): Promise<Transaction | null> {
        try {
            let buffer = await this.transactionsDb.get(hash);
            return Transaction.fromBuffer(buffer);
        } catch (error) {
            return onLevelErrorGet(error);
        }
    }

    async getUnsignedTx(hash: string): Promise<UnsignedTransaction | null> {
        try {
            let buffer = await this.transactionsDb.get(hash);
            return UnsignedTransaction.fromBuffer(buffer);
        } catch (error) {
            return onLevelErrorGet(error);
        }
    }

    async getRewardTx(hash: string): Promise<RewardTransaction | null> {
        try {
            let buffer = await this.transactionsDb.get(hash);
            return RewardTransaction.fromBuffer(buffer);
        } catch (error) {
            return onLevelErrorGet(error);
        }
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

    async walkOverTransactions(): Promise<void> {
        let stream = this.transactionsDb.createReadStream({ keys: true, values: true });
        for await (const data of stream) {
            let hash: any = data.key;
            let buffer: Buffer = data.value;
            let tx = Transaction.fromBuffer(buffer);
            console.log(hash, tx);
        }

        stream = this.rewardsDb.createReadStream({ keys: true, values: true });
        for await (const data of stream) {
            let hash: any = data.key;
            let buffer: Buffer = data.value;
            let tx = RewardTransaction.fromBuffer(buffer);
            console.log(hash, tx);
        }

        stream = this.unsignedDb.createReadStream({ keys: true, values: true });
        for await (const data of stream) {
            let hash: any = data.key;
            let buffer: Buffer = data.value;
            let tx = UnsignedTransaction.fromBuffer(buffer);
            console.log(hash, tx);
        }
    }
}