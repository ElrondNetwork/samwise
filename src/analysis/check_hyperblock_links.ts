import { readdirSync } from "fs";
import path = require("path");
import { NodeDatabase } from "../nodeDatabase";
const { Command } = require("commander");

async function main() {
    const program = new Command();
    program
        .requiredOption("-w, --workspace <workspace>")
        .requiredOption("-s, --shards <shards>", "shard assignments", "0,1,2,metachain");

    try {
        program.parse(process.argv)
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }

    let workspace = program.workspace;
    let shardAssignments = program.shards.split(",");
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
            await checkLinksBetweenTxAndMetaBlock(nodeDb);
        } catch (error) {
            console.error(error);
        }

        await nodeDb.close();
    }
}

async function checkLinksBetweenTxAndMetaBlock(nodeDb: NodeDatabase) {
    let hashes = await nodeDb.getLookupTxHashes();

    let rewardsIssues = 0;
    let scrIssues = 0;
    let regularIssues = 0;

    for (const hash of hashes) {
        let miniblockMetadata = await nodeDb.getMiniblockMetadataByTx(hash);
        let isRewards = miniblockMetadata!.isRewards();
        let isSCR = miniblockMetadata!.isSCR();
        let metablockHash = miniblockMetadata!.hyperblockHash();
        let metaBlock = await nodeDb.getMetaBlock(metablockHash);

        if (!metaBlock) {
            if (isRewards) {
                rewardsIssues++;
                continue;
            }

            if (isSCR) {
                scrIssues++;
                continue;
            }

            regularIssues++;

            console.log("Bad link");
            console.log("=================================")
            console.log(miniblockMetadata);
            console.log("Miniblock", miniblockMetadata?.hash);
            console.log("Metablock", metablockHash);
            console.log("Transaction", hash);
            continue;
        }

        let contains = metaBlock.containsMiniblock(miniblockMetadata!.hash);
        if (!contains) {
            console.log(`! Bad link, miniblock ${miniblockMetadata!.hash} (${miniblockMetadata!.type}) not found in metablock ${metaBlock.nonce}`);
            console.log(`! Tx ${hash}`);
            console.log(miniblockMetadata);
            console.log(metaBlock);
        }
    }

    console.log("\ttotal txs", hashes.length);
    console.log("\tregular tx issues", regularIssues);
    console.log("\trewards issues", rewardsIssues);
    console.log("\tscr issues", scrIssues);
}

(async () => {
    await main();
})();