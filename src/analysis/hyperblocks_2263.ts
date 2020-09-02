import { readdirSync } from "fs";
import path = require("path");
import { NodeDatabase } from "../nodeDatabase";
import { Epoch } from "../epochByHash";

let firstTxEver = "92e52c0050edec44cfa1af92cca47261de0776709ad2156ffc9b19b43a0f9449";
let missingTx = "a6d59251e8b2f16c3179c7b8814f0063a842de8a20f07d7aa576bb6918f1c8ea";

async function main() {
    let workspace = "/home/andrei/ToTheNetwork/Squad/databases/nodes-2sept-test";
    let shardAssignments = [2];

    let i = 0;
    let folders = readdirSync(workspace, { withFileTypes: true }).filter((item: any) => item.isDirectory());

    for (const item of folders) {
        let nodePath = path.join(workspace, item.name);
        let shard = shardAssignments[i++];

        await studyNodeDatabase(nodePath, shard);
    }
}

async function studyNodeDatabase(nodePath: string, shard: string) {
    console.log(">> studyNodeDatabase():", "shard", shard);

    let dbpath = path.join(nodePath, "db", "1")
    let nodeDb = new NodeDatabase(dbpath, shard);

    await nodeDb.open();

    //await inspectMetablock(nodeDb);
    await inspectExistenceOfHyperblockCoordinates(nodeDb);
    await inspectLinkBetweenTxAndMetaBlock(nodeDb);
    await nodeDb.close();
}

async function inspectMetablock(nodeDb: NodeDatabase) {
    let miniblockMetadata = await nodeDb.getMiniblockMetadataByTx(firstTxEver);
    if (!miniblockMetadata) {
        return;
    }

    console.log(miniblockMetadata);

    let metablockHash = miniblockMetadata.notarizedAtDestinationInMetaHash;
    let metaBlock = await nodeDb.getEpochDb(new Epoch(0)).getMetaBlock(metablockHash);
    console.log(metaBlock);
    console.log(metaBlock.containsMiniblock(miniblockMetadata.hash));
}

async function inspectLinkBetweenTxAndMetaBlock(nodeDb: NodeDatabase) {
    console.log("inspectLinkBetweenTxAndMetaBlock");

    let hashes = await nodeDb.getTxHashes();

    let rewardsIssues = 0;
    let scrIssues = 0;

    for (const hash of hashes) {
        let miniblockMetadata = await nodeDb.getMiniblockMetadataByTx(hash);
        let isRewards = miniblockMetadata!.type == 255;
        let isSCR = miniblockMetadata!.type == 90;

        let metablockHash = miniblockMetadata!.notarizedAtDestinationInMetaHash;
        let metaBlock = await nodeDb.getMetaBlock(metablockHash);
        if (!metaBlock) {
            if (isRewards) {
                rewardsIssues++;
                console.log(miniblockMetadata);
            } else if (isSCR) {
                scrIssues++;
                console.log(miniblockMetadata);
            } else {
                console.log("Bad link");
                console.log("=================================")
                console.log(miniblockMetadata);
                console.log("Miniblock", miniblockMetadata?.hash);
                console.log("Metablock", metablockHash);
                console.log("Transaction", hash);
            }
        }
    }

    console.log("rewardsIssues", rewardsIssues);
    console.log("scrIssues", scrIssues);
}

async function inspectExistenceOfHyperblockCoordinates(nodeDb: NodeDatabase) {
    console.log("inspectExistenceOfHyperblockCoordinates");

    let hashes = await nodeDb.getTxHashes();

    let rewardsIssues = 0;
    let scrIssues = 0;

    let issues = 0;
    for (const hash of hashes) {
        let metadata = await nodeDb.getMiniblockMetadataByTx(hash);
        let isRewards = metadata!.type == 255;
        let isSCR = metadata!.type == 90;

        if (metadata!.hasIssues()) {
            if (isRewards) {
                rewardsIssues++;
                console.log(metadata);
            } else if (isSCR) {
                scrIssues++;
            } else {
                issues++;
                console.log("Missing hyperblock coordinates:");
                //console.log(metadata);
            }
        }
    }

    console.log("total txs", hashes.length);
    console.log("issues", issues);
    console.log("rewardsIssues", rewardsIssues);
    console.log("scrIssues", scrIssues);
}

(async () => {
    await main();
})();