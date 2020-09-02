export const IndexDbOptions = {
    keyEncoding: "hex",
    valueEncoding: "hex"
};

export const PayloadDbOptions = {
    keyEncoding: "hex",
    valueEncoding: "binary"
};

export const ProtoToObjectOptions = {
    enums: String,
    longs: Number,
    defaults: true,
    arrays: true,
    objects: true,
    oneofs: true
};