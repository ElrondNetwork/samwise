import { readdirSync } from "fs";
import path = require("path");
import { NodeDatabase } from "../nodeDatabase";
import { setupSharedArguments, getSharedArguments, parseArguments } from "./shared";
import { Epoch } from "../epochByHash";
const { Command } = require("commander");

async function main() {
    const program = new Command();
    setupSharedArguments(program);
    parseArguments(program);

    let { workspace, shardAssignments } = getSharedArguments(program);
    console.log("Checking workspace:", workspace);
    console.log("Shard assignments:", shardAssignments);

    let folders = readdirSync(workspace, { withFileTypes: true }).filter((item: any) => item.isDirectory());
    for (const [index, item] of folders.entries()) {
        console.log("Folder:", item.name);

        let nodePath = path.join(workspace, item.name);
        let shard = shardAssignments[index];

        let dbpath = path.join(nodePath, "db", "1")
        let nodeDb = new NodeDatabase(dbpath, shard);

        await nodeDb.open();

        try {
            await doCheck(nodeDb);
        } catch (error) {
            console.error(error);
        }

        await nodeDb.close();
    }
}

async function doCheck(nodeDb: NodeDatabase) {
    let hashes = await nodeDb.getLookupTxHashes();
    let coreHashes = await nodeDb.getCoreTxHashes();

    let db = nodeDb.getEpochDb(new Epoch(0));
    await db.walkOverTransactions();

    for (const hash of coreHashes) {
        if (!hashes.includes(hash)) {
            console.log(`Hash: ${hash}`);

            let coreTx = await nodeDb.getAnyTx(hash);
            console.log(coreTx);
        }

        let coreTx = await nodeDb.getAnyTx(hash);
        console.log(coreTx);
    }
}

(async () => {
    await main();
})();
