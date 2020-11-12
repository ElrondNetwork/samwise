import { readdirSync } from "fs";
import path = require("path");
import { NodeDatabase } from "../nodeDatabase";
import { setupSharedArguments, parseArguments, getSharedArguments } from "./shared";
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
    let hashes = await nodeDb.getLookupMiniblocksHashes();
    let issues = 0;

    for (const hash of hashes) {
        let metadata = await nodeDb.getMiniblockMetadata(hash);
        if (metadata!.hasIssues()) {
            issues++;
            console.log("Missing hyperblock coordinates:");
            console.log(metadata);
        }
    }

    console.log("total miniblocks", hashes.length);
    console.log("issues", issues);
}

(async () => {
    await main();
})();