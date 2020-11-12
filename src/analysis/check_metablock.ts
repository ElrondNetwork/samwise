import { NodeDatabase } from "../nodeDatabase";
import { Epoch } from "../epochByHash";

async function main() {
    let hash = "...";
    let dbPath = ".../elrond-nodes/node-3/db/1";
    let nodeDb = new NodeDatabase(dbPath, "metachain");

    await nodeDb.open();

    let epochDb = nodeDb.getEpochDb(new Epoch(34));
    let metablock = await epochDb.getMetaBlock(hash);
    console.log(metablock);

    await nodeDb.close();
}

(async () => {
    await main();
})();