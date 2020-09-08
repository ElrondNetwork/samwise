import { Root } from "protobufjs";

let root = new Root();
root.loadSync("./src/proto/miniblockMetadata.proto");
root.loadSync("./src/proto/metaBlock.proto");
root.loadSync("./src/proto/block.proto");
root.loadSync("./src/proto/epochByHash.proto");
root.loadSync("./src/proto/rewardTx.proto");
root.loadSync("./src/proto/smartContractResult.proto");
root.loadSync("./src/proto/transaction.proto");
root.loadSync("./src/proto/userAccountData.proto");

export const MiniblockMetadataMessage = root.lookupType("proto.MiniblockMetadata");
export const MetaBlockMessage = root.lookupType("proto.MetaBlock");
export const EpochByHashMessage = root.lookupType("proto.EpochByHash");
export const RewardTxMessage = root.lookupType("protoRewardTx.RewardTx");
export const ScrMessage = root.lookupType("proto.SmartContractResult");
export const TxMessage = root.lookupType("proto.Transaction");
export const UserAccountDataMessage = root.lookupType("proto.UserAccountData");
