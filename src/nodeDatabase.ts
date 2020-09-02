var level = require("level");
const { readdirSync } = require('fs')

import * as path from "path";
import { Epoch } from "./epochByHash";
import { MiniblockMetadata } from "./miniblockMetadata";
import { EpochDatabase } from "../epochDatabase";
import { PayloadDbOptions, IndexDbOptions } from "./shared";
import { MetaBlock } from "./metaBlock";

export class NodeDatabase {
    private readonly dbpath: string;
    private readonly shard: string;

    private epochByHashIndex: any;
    private miniblockByTxHashIndex: any;
    private epochDatabases: EpochDatabase[];

    constructor(dbpath: string, shard: string) {
        this.dbpath = dbpath;
        this.shard = shard;
        this.epochDatabases = [];
    }

    async open(): Promise<void> {
        let dbpath = this.dbpath;
        let shard = this.shard;

        let epochByHashDbPath = path.join(dbpath, "Static", `Shard_${shard}`, "DbLookupExtensions_EpochByHash");
        let miniblockHashByTxHashPath = path.join(dbpath, "Static", `Shard_${shard}`, "DbLookupExtensions_MiniblockHashByTxHash")

        this.epochByHashIndex = await level(epochByHashDbPath, PayloadDbOptions);
        this.miniblockByTxHashIndex = await level(miniblockHashByTxHashPath, IndexDbOptions);

        await this.epochByHashIndex.open();
        await this.miniblockByTxHashIndex.open();

        if (!this.epochByHashIndex.isOpen()) {
            throw new Error("stop");
        }

        if (!this.miniblockByTxHashIndex.isOpen()) {
            throw new Error("stop");
        }


        let epochFolders = readdirSync(dbpath, { withFileTypes: true }).filter((item: any) => item.isDirectory() && item.name != "Static");
        
        epochFolders.forEach((item: any) => {
            let nameParts = item.name.split("_");
            let epoch = Number(nameParts[1]);
            let epochDbPath = path.join(dbpath, item.name);

            this.epochDatabases[epoch] = new EpochDatabase(epoch, epochDbPath, this.shard);
        });
        
        for (const db of this.epochDatabases) {
            await db.open();
        }
    }

    async close() {
        await this.epochByHashIndex.close();
        await this.miniblockByTxHashIndex.close();

        this.epochDatabases.forEach(async (db) => {
            await db.close();
        });
    }

    async getTxHashes(): Promise<string[]> {
        let result = [];
        let stream = this.miniblockByTxHashIndex.createReadStream({ keys: true, values: false });

        for await (const data of stream) {
            let hash: any = data;
            result.push(hash);
        }

        return result;
    }

    async getMiniblockMetadataByTx(hash: string): Promise<MiniblockMetadata | null> {
        try {
            let miniblockHash = await this.miniblockByTxHashIndex.get(hash);
            let epoch = await this.getEpochBy(miniblockHash);
            let db = this.getEpochDb(epoch);
            let metadata = db.getMiniblockMetadata(miniblockHash);
            return metadata;
        } catch (error) {
            if (error.notFound) {
                return null;
            }

            throw error;
        }
    }

    async getMetaBlock(hash: string): Promise<MetaBlock | null> {
        for (const db of this.epochDatabases) {
            if (db.containsMetaBlock(hash)) {
                return await db.getMetaBlock(hash);
            }
        }

        return null;
    }

    async getEpochBy(hash: string): Promise<Epoch> {
        let data = await this.epochByHashIndex.get(hash);
        let epoch = Epoch.fromBuffer(data);
        return epoch;
    }

    getEpochDb(epoch: Epoch): EpochDatabase {
        let db = this.epochDatabases[epoch.get()];
        if (!db) {
            throw new Error(`No db for epoch ${epoch.get()}.`);
        }

        return db;
    }
}
