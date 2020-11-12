import base64
import difflib
import logging
import shutil
from argparse import ArgumentParser
from pathlib import Path
from typing import Any

from apidiff import samples, shared


class Context:
    def __init__(self, workspace, api_url_a, api_url_b) -> None:
        self.workspace = Path(workspace)
        self.api_url_b = api_url_b
        self.api_url_a = api_url_a


def main():
    logging.basicConfig(level=logging.INFO)

    parser = ArgumentParser()
    parser.add_argument("--a", default="https://api.elrond.com")
    parser.add_argument("--b", default="https://staging-api.elrond.com")
    parser.add_argument("--workspace", required=True)
    args = parser.parse_args()

    context = Context(args.workspace, args.a, args.b)

    shared.ensure_folder(context.workspace)

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
    shared.ensure_folder(context.workspace / "a" / group)
    shared.ensure_folder(context.workspace / "b" / group)

    if not tag:
        tag = url.replace("/", "_").replace("?", "_Q_").replace("=", "_eq_")

    a = shared.do_get(f"{context.api_url_a}/{url}")
    b = shared.do_get(f"{context.api_url_b}/{url}")

    a = _post_process_reponse(a, url)
    b = _post_process_reponse(b, url)

    a_json_file = context.workspace / "a" / group / f"{tag}.json"
    b_json_file = context.workspace / "b" / group / f"{tag}.json"
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
    shared.write_file(context.workspace / f"{tag}.diff.txt", diff_content)


# Post process the response - ignore some fields etc, ignore ordering, remove identification info.
def _post_process_reponse(response, url) -> Any:
    if isinstance(response, dict):
        response = [response]

    if "blocks" in url:
        for block in response:
            del block["validators"]
        # Also ignore ordering of blocks in response
        response = sorted(response, key=lambda item: item["hash"])

    if "transactions" in url:
        for transaction in response:
            # Ignore ordering of sc results
            if "scResults" in transaction:
                transaction["scResults"] = sorted(transaction["scResults"], key=lambda item: f"{item['nonce']}{item.get('value')}")

    for item in response:
        shared.mutate_struct_recursively(item, hide_data)

    return response


def hide_data(key: str, value: Any) -> Any:
    str_value = str(value)

    print("hide data", key, str_value[:16])

    # Hide addresses
    if str_value.startswith("erd1"):
        return "erd1..."

    # Truncate hashes
    if len(str_value) in [64, 128, 192]:
        try:
            int(str_value, 16)
            return str_value[:4] + "..."
        except ValueError:
            pass

    # Truncate base64-data
    try:
        base64.b64decode(str_value)
        return str_value[:4] + "..."
    except ValueError:
        pass

    return value


if __name__ == "__main__":
    main()
