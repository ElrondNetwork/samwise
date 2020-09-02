import { loadSync, Root } from "protobufjs";

let root = new Root();
root.loadSync("./src/proto/miniblockMetadata.proto");
root.loadSync("./src/proto/metaBlock.proto");
root.loadSync("./src/proto/block.proto");
root.loadSync("./src/proto/epochByHash.proto");

export const MiniblockMetadataMessage = root.lookupType("proto.MiniblockMetadata");
export const MetaBlockMessage = root.lookupType("proto.MetaBlock");
export const EpochByHashMessage = root.lookupType("proto.EpochByHash");
