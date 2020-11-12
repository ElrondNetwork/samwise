import json
import pathlib
from os import PathLike
from pathlib import Path
from typing import Any, Union

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
        json.dump(data, f, indent=4)


def read_lines(filename: PathLike, strip=False):
    with open(str(filename)) as f:
        lines = f.readlines()

    if strip:
        lines = [line.strip() for line in lines]
        lines = [line for line in lines if line]

    return lines


def write_file(filename: PathLike, text: str):
    with open(str(filename), "w") as f:
        return f.write(text)


def ensure_folder(folder: Union[str, Path]):
    pathlib.Path(folder).mkdir(parents=True, exist_ok=True)
