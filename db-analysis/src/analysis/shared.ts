import { exit } from "process";

export function setupSharedArguments(program: any) {
    program
        .requiredOption("-w, --workspace <workspace>")
        .requiredOption("-s, --shards <shards>", "shard assignments", "0,1,2,metachain");
}

export function parseArguments(program: any) {
    try {
        program.parse(process.argv)
    } catch (error) {
        console.error(`Error: ${error.message}`);
        exit();
    }
}

export function getSharedArguments(program: any) {
    return {
        workspace: program.workspace,
        shardAssignments: program.shards.split(",")
    }
}