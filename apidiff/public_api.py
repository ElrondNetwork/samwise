import difflib
import logging
from argparse import ArgumentParser
from pathlib import Path
from typing import Any

from apidiff import samples, shared


class Context:
    def __init__(self, data_folder, api_url_a, api_url_b) -> None:
        self.data_folder = Path(data_folder)
        self.api_url_b = api_url_b
        self.api_url_a = api_url_a


def main():
    logging.basicConfig(level=logging.INFO)

    parser = ArgumentParser()
    parser.add_argument("--a", default="https://api.elrond.com")
    parser.add_argument("--b", default="https://staging-api.elrond.com")
    parser.add_argument("--data-folder", required=True)
    args = parser.parse_args()

    context = Context(args.data_folder, args.a, args.b)

    shared.ensure_folder(context.data_folder)

    do_diff(context, "network/config", "network", "GET_network_config")
    do_diff(context, "network/status/4294967295", "network", "GET_network_metachain_status")
    do_diff(context, f"address/{samples.F_DELEGATION_ADDRESS}", "address", "GET_account_by_address")
    do_diff(context, "blocks?nonce=42", "blocks", "GET_blocks_by_nonce")
    do_diff(context, f"blocks/{samples.E_BLOCK}", "blocks", "GET_blocks_by_hash")
    do_diff(context, "blocks", "blocks", "GET_blocks_top")
    do_diff(context, f"transactions/{samples.A_SUCCESSFUL_TRANSACTION}", "transactions", "GET_transactions_by_hash_successful")
    do_diff(context, f"transactions/{samples.B_INVALID_TRANSACTION}", "transactions", "GET_transactions_by_hash_invalid")
    do_diff(context, f"transactions/{samples.C_FAILED_TRANSACTION}", "transactions", "GET_transactions_by_hash_failed")
    do_diff(context, f"transactions/{samples.D_REWARDS_TRANSACTION}", "transactions", "GET_transactions_by_hash_rewards")
    do_diff(context, f"transactions?miniBlockHash={samples.G_MINIBLOCK_SUCCESSFUL}", "transactions", "GET_transactions_by_miniblock_successful")
    do_diff(context, f"transactions?miniBlockHash={samples.H_MINIBLOCK_FAILED}", "transactions", "GET_transactions_by_miniblock_failed")

    # do_diff(context, f"transaction/{samples.A_SUCCESSFUL_TRANSACTION}", "transaction", "GET_transaction_by_hash_successful")
    # do_diff(context, f"transaction/{samples.B_INVALID_TRANSACTION}", "transaction", "GET_transaction_by_hash_invalid")
    # do_diff(context, f"transaction/{samples.C_FAILED_TRANSACTION}", "transaction", "GET_transaction_by_hash_failed")
    # do_diff(context, f"transaction/{samples.D_REWARDS_TRANSACTION}", "transaction", "GET_transaction_by_hash_rewards")


def do_diff(context: Context, url, group, tag):
    shared.ensure_folder(context.data_folder / "a" / group)
    shared.ensure_folder(context.data_folder / "b" / group)

    if not tag:
        tag = url.replace("/", "_").replace("?", "_Q_").replace("=", "_eq_")

    a = shared.do_get(f"{context.api_url_a}/{url}")
    b = shared.do_get(f"{context.api_url_b}/{url}")

    a = _post_process_reponse(a, url)
    b = _post_process_reponse(b, url)

    a_json_file = context.data_folder / "a" / group / f"{tag}.json"
    b_json_file = context.data_folder / "b" / group / f"{tag}.json"
    shared.write_json_file(a_json_file, a)
    shared.write_json_file(b_json_file, b)

    a_lines = shared.read_lines(a_json_file)
    b_lines = shared.read_lines(b_json_file)

    if a_lines == b_lines:
        return

    print(f"Diff detected on: {tag}")

    differ = difflib.Differ()
    diff = differ.compare(a_lines, b_lines)
    diff_content = "".join(diff)
    shared.write_file(context.data_folder / f"{tag}.diff.txt", diff_content)


# Post process the response - ignore some fields etc, ignore ordering, remove identification info.
# TODO: Refactor, extract duplication.
def _post_process_reponse(response, url) -> Any:
    if isinstance(response, dict):
        response = [response]

    if "blocks" in url:
        for block in response:
            del block["validators"]
            if len(str(block["proposer"])) > 4:
                block["proposer"] = str(block["proposer"])[:4] + "..."
        # Also ignore ordering of blocks in response
        response = sorted(response, key=lambda item: item["hash"])

    if "transactions" in url:
        for transaction in response:
            transaction["txHash"] = str(transaction["txHash"])[:4] + "..."
            transaction["miniBlockHash"] = str(transaction["txHash"])[:4] + "..."
            if "signature" in transaction:
                transaction["signature"] = str(transaction["signature"])[:4] + "..."
            if "data" in transaction:
                transaction["data"] = str(transaction["data"])[:4] + "..."
            transaction["receiver"] = "erd1..." if "erd1" in transaction["receiver"] else transaction["receiver"]
            transaction["sender"] = "erd1..." if "erd1" in transaction["sender"] else transaction["sender"]

            # Also ignore ordering of sc results
            if "scResults" in transaction:
                transaction["scResults"] = sorted(transaction["scResults"], key=lambda item: f"{item['nonce']}{item.get('value')}")

                for result in transaction["scResults"]:
                    result["receiver"] = "erd1..." if "erd1" in result["receiver"] else result["receiver"]
                    result["sender"] = "erd1..." if "erd1" in result["sender"] else result["sender"]

                    if "prevTxHash" in result:
                        result["prevTxHash"] = str(result["prevTxHash"])[:4] + "..."
                    if "originalTxHash" in result:
                        result["originalTxHash"] = str(result["originalTxHash"])[:4] + "..."
                    if "data" in result:
                        result["data"] = str(result["data"])[:4] + "..."
                    if "hash" in result:
                        result["hash"] = str(result["hash"])[:4] + "..."

    if "address" in url:
        for address in response:
            address["data"]["account"]["address"] = "erd1..."
            address["data"]["account"]["code"] = "..."

    return response


if __name__ == "__main__":
    main()
