# samwise

Miscellaneous `HTTP API`-related tools.

## Database analysis

### Check `DbLookupExtensions`

Note: `DbLookupExtensions` is the feature that enables the Hyperblocks API and the linking between Transactions and Hyperblocks.

Check whether all transactions have the hyperblock coordinate set:

```
npx ts-node ./src/analysis/check_hyperblock_links.ts --workspace=~/elrond-nodes --shards=0,1,2,metachain
```

## API diff-ing

### Diffs for API Facade (Elrond Public API)

```
...
```

### Diffs for Gateway API (Elrond Proxy API)

```
...
```