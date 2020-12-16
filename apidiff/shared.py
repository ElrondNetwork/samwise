import json
import pathlib
from os import PathLike
from pathlib import Path
from typing import Any, Callable, Union

import requests


def do_get(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
        parsed = response.json()
        return parsed
    except requests.ConnectionError as err:
        raise ApiRequestError(url, err)
    except Exception as err:
        raise ApiRequestError(url, err)


def do_post(url, payload):
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        parsed = response.json()
        return parsed
    except requests.ConnectionError as err:
        raise ApiRequestError(url, err)
    except Exception as err:
        raise ApiRequestError(url, err)


class KnownError(Exception):
    inner = None

    def __init__(self, message: str, inner: Union[Any, None] = None):
        super().__init__(message)
        self.inner = inner

    def get_pretty(self) -> str:
        if self.inner:
            return f"""{self}
... {self.inner}
"""
        return str(self)


class ApiRequestError(KnownError):
    def __init__(self, url: str, data: Any):
        super().__init__(f"Proxy request error for url [{url}]: {data}")


def write_json_file(filename: PathLike, data: Any):
    with open(str(filename), "w") as f:
        json.dump(data, f, indent=4, sort_keys=True)


def read_lines(filename: PathLike, strip=False):
    with open(str(filename)) as f:
        lines = f.readlines()

    if strip:
        lines = [line.strip() for line in lines]
        lines = [line for line in lines if line]

    return lines


def read_file(f: PathLike) -> str:
    with open(f, "r") as f:
        return f.read()


def write_file(filename: PathLike, text: str):
    with open(str(filename), "w") as f:
        return f.write(text)


def ensure_folder(folder: Union[str, Path]):
    pathlib.Path(folder).mkdir(parents=True, exist_ok=True)


def mutate_struct_recursively(data, mutate_item: Callable[[str, Any], Any]):
    for (key, value) in list(iterate_over(data)):
        if is_iterable(value):
            mutate_struct_recursively(value, mutate_item)
        else:
            data[key] = mutate_item(key, value)


def is_iterable(data) -> bool:
    return isinstance(data, dict) or isinstance(data, list)


def iterate_over(data):
    if isinstance(data, dict):
        for key, value in data.items():
            yield (key, value)
    elif isinstance(data, list):
        for index, value in enumerate(data):
            yield (index, value)
    else:
        raise KnownError("Unknown data structure, expected dict or list.")


def delete_in_struct(struct, path_segments):
    index_last_segment = len(path_segments) - 1

    for index, segment in enumerate(path_segments):
        if index == index_last_segment:
            del struct[segment]
            return
        if segment == "[each]":
            for each in struct:
                delete_in_struct(each, path_segments[index + 1:])
            return
        else:
            struct = struct.get(segment)


def sort_in_struct(struct, what_segments, by_fields):
    if what_segments == ["[self]"]:
        struct.sort(key=lambda item: ",".join([str(item[field]) for field in by_fields]))
        return

    index_last_segment = len(what_segments) - 1

    for index, segment in enumerate(what_segments):
        if index == index_last_segment:
            if segment in struct:
                struct[segment] = sorted(struct[segment], key=lambda item: ",".join([str(item[field]) for field in by_fields]))
            return
        if segment == "[each]":
            for each in struct:
                sort_in_struct(each, what_segments[index + 1:], by_fields)
            return
        else:
            struct = struct.get(segment)


def parse_path_segments(compound_path: str):
    segments = compound_path.split(".")
    return segments
