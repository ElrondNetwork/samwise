import base64
import difflib
import json
import logging
import os
import re
from argparse import ArgumentParser
from pathlib import Path
from typing import Any

from apidiff import shared
from apidiff.shared import parse_path_segments


class Profile:
    def __init__(self, versions: list):
        self.versions = [Version(item) for item in versions]


class Version:
    def __init__(self, d: dict):
        self.tag = ""
        self.url = ""
        self.endpoints = []
        self.__dict__.update(d)
        self.endpoints = [Endpoint(item) for item in self.endpoints]


class Endpoint:
    def __init__(self, d: dict):
        self.group = ""
        self.get = ""
        self.response = ""
        self.normalize = None
        self.__dict__.update(d)
        self.normalize = NormalizeDef(self.normalize)


class NormalizeDef:
    def __init__(self, d: dict):
        self.ignore = []
        self.sort = []

        if d is None:
            return

        self.__dict__.update(d)
        self.ignore = [shared.parse_path_segments(item) for item in self.ignore]
        self.sort = [SortDef(item) for item in self.sort]


class SortDef:
    def __init__(self, d: dict):
        self.what = ""
        self.by = []
        self.__dict__.update(d)
        self.what = parse_path_segments(self.what)


class Context:
    def __init__(self, workspace, profile: Profile) -> None:
        self.workspace = Path(workspace)
        self.profile = profile


def main():
    logging.basicConfig(level=logging.INFO)

    parser = ArgumentParser()
    parser.add_argument("--profile", required=True)
    parser.add_argument("--workspace", required=True)
    args = parser.parse_args()

    profile = load_profile(args.profile)
    context = Context(args.workspace, profile)

    do_requests(context)
    do_simple_diff(context)


def do_requests(context: Context):
    for version in context.profile.versions:
        tag = version.tag
        url = version.url
        endpoints = version.endpoints

        for endpoint in endpoints:
            print("GET", f"{url}/{endpoint.get}")
            response = shared.do_get(f"{url}/{endpoint.get}")
            response = normalize_response(response, endpoint.normalize)

            folder = context.workspace / tag / endpoint.group
            shared.ensure_folder(folder)
            json_file = folder / endpoint.response
            shared.write_json_file(json_file, response)


def load_profile(file: str):
    content = shared.read_file(file)
    content = replace_placeholders(content)
    data = json.loads(content)
    profile = Profile(data)
    return profile


def replace_placeholders(input: str):
    pattern = re.compile("\\${{(.*?)}}")
    matches = re.findall(pattern, input)

    for variable in matches:
        value = os.environ.get(variable, "")
        if not value:
            raise shared.KnownError(f"Missing variable: {variable}")
        input = input.replace(f"${{{{{variable}}}}}", value)

    return input


def do_simple_diff(context: Context):
    if len(context.profile.versions) != 2:
        raise shared.KnownError("Can only diff between 2 versions.")

    version_a = context.profile.versions[0]
    version_b = context.profile.versions[1]

    if len(version_a.endpoints) != len(version_b.endpoints):
        raise shared.KnownError("Simple diff not applicable")

    for endpoint in version_a.endpoints:
        print(f"Check diff for: {endpoint.group} / {endpoint.response}")
        json_file_a = context.workspace / version_a.tag / endpoint.group / endpoint.response
        json_file_b = context.workspace / version_b.tag / endpoint.group / endpoint.response

        lines_a = shared.read_lines(json_file_a)
        lines_b = shared.read_lines(json_file_b)

        if lines_a == lines_b:
            continue

        print(f"Diff detected on: {endpoint.group} / {endpoint.response}")

        differ = difflib.Differ()
        diff = differ.compare(lines_a, lines_b)
        diff_content = "".join(diff)
        shared.write_file(context.workspace / f"{endpoint.response}.diff.txt", diff_content)


# Post process the response - ignore some fields etc, ignore ordering, remove identification info.
def normalize_response(response, normalize: NormalizeDef) -> Any:
    for ignoreable_path in normalize.ignore:
        shared.delete_in_struct(response, ignoreable_path)

    for sort in normalize.sort:
        shared.sort_in_struct(response, sort.what, sort.by)

    shared.mutate_struct_recursively(response, hide_data)

    return response


def hide_data(key: str, value: Any) -> Any:
    str_value = str(value)

    # Truncate large data (e.g. contract code)
    if len(str_value) > 256:
        return str_value[:4] + "..."

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
