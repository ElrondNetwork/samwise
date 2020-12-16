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
export FROM_V=v1
export TO_V=v2
export FROM_TO=${FROM_V}-to-${TO_V}

python3 ./apidiff/public_api.py --workspace=./workspaces/${FROM_TO} --profile=./apidiff/profiles/${FROM_TO}.json
git diff --color-words --no-index ./workspaces/${FROM_TO}/${FROM_V} ./workspaces/${FROM_TO}/${TO_V} | ./apidiff/ansi2html.sh > ./workspaces/${FROM_TO}/gitdiff.html
```

### Diffs for Gateway API (Elrond Proxy API)

```
export FROM_V=v1.1.4
export TO_V=v1.1.5
export FROM_TO=${FROM_V}-to-${TO_V}

python3 ./apidiff/public_api.py --workspace=./workspaces/${FROM_TO} --profile=./apidiff/profiles/${FROM_TO}.json
git diff --color-words --no-index ./workspaces/${FROM_TO}/${FROM_V} ./workspaces/${FROM_TO}/${TO_V} | ./apidiff/ansi2html.sh > ./workspaces/${FROM_TO}/gitdiff.html
```
