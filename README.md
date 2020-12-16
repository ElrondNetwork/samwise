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


```
export PYTHONPATH=.
source ./apidiff/profiles/env.sh
```

### Diffs for API Facade (Elrond Public API)

```
python3 ./apidiff/public_api.py --workspace=./workspaces/v0-to-v1 --profile=./apidiff/profiles/v0-to-v1.json
git diff --color-words --no-index ./workspaces/v0-to-v1/v0 ./workspaces/v0-to-v1/v1 | ./apidiff/ansi2html.sh > ./workspaces/v0-to-v1/gitdiff.html
```

### Diffs for Gateway API (Elrond Proxy API)

```
python3 ./apidiff/public_api.py --workspace=./workspaces/v1.1.4-to-v1.1.5 --profile=./apidiff/profiles/v1.1.4-to-v1.1.5.json
git diff --color-words --no-index ./workspaces/v1.1.4-to-v1.1.5/v1.1.4 ./workspaces/v1.1.4-to-v1.1.5/v1.1.5 | ./apidiff/ansi2html.sh > ./workspaces/v1.1.4-to-v1.1.5/gitdiff.html
```
