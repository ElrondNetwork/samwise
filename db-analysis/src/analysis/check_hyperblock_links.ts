import { readdirSync } from "fs";
import path = require("path");
import { NodeDatabase } from "../nodeDatabase";
import { setupSharedArguments, getSharedArguments, parseArguments } from "./shared";
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
        console.log(">>> Folder:", item.name);

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
    let issues = 0;

    for (const hash of hashes) {
        let miniblockMetadata = await nodeDb.getMiniblockMetadataByTx(hash);
        let metablockHash = miniblockMetadata!.hyperblockHash();
        let metaBlock = await nodeDb.getMetaBlock(metablockHash);

        if (!metaBlock) {
            issues++;

            console.log("=================================")
            console.log("! Bad link, metablock not found.");
            console.log("=================================")
            console.log("! Miniblock", miniblockMetadata?.hash);
            console.log("! Metablock", metablockHash);
            console.log("! Tx", hash);
            console.log("=================================")
            console.log(miniblockMetadata);
            console.log("=================================")

            continue;
        }

        let contains = metaBlock.containsMiniblock(miniblockMetadata!.hash);
        if (!contains) {
            issues++;

            console.log("=================================")
            console.log(`! Bad link, miniblock ${miniblockMetadata!.hash} (${miniblockMetadata!.type}) not found in metablock ${metaBlock.nonce}`);
            console.log(`! Tx ${hash}`);
            console.log("=================================")
            console.log(miniblockMetadata);
            console.log("=================================")
            console.log(metaBlock);
            console.log("=================================")
        }
    }

    console.log("total txs", hashes.length);
    console.log("issues", issues);
}

(async () => {
    await main();
})();