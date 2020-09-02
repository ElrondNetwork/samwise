# samwise
Transactions &amp; Addresses watcher, plus Node database analysis tool.

**Work in progress!**

## Database analysis

### Check "DbLookupExtensions"

Check whether all transactions have the hyperblock coordinate set:

```
npx ts-node ./src/analysis/check_hyperblock_links.ts --workspace=~/elrond-nodes --shards=0,1,2,metachain
```