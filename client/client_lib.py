import requests
from pprint import pprint
from os import path

import client_utils as util


def add_file(initial_dir: str):
    api = util.get_api()

    file_selections = util.ask_filename(initial_dir)
    if not file_selections:
        print("No files selected or operation canceled.")
        return

    artist = util.ask_artist()
    print()

    rating = util.ask_rating()
    print()

    type_name = util.ask_type("Image type index")
    print()

    df = util.DISPLAY_FILE(
        artist,
        "(multiple values)" if len(file_selections) > 1 else file_selections[0],  # type: ignore
        type_name,
        rating,
    )

    print(str(df))
    confirm = input("Confirm selections (y/n): ")
    if confirm.strip() != "y" and confirm.strip() != "":
        print("Operation canceled.")
        return

    try:
        for file in file_selections:
            metadata = {
                "artist": artist,
                "path": util.replace_win_path(file.strip()),
                "type": type_name,
                "rating": rating,
            }

            response = requests.post(api + "/database/add", json=metadata, timeout=5)
            if response.status_code is not requests.codes.ok:
                print(
                    f"Server responded with HTTP {response.status_code}. '{response.reason}', '{response.text}'"
                )
                break
            else:
                print(f"OK - {path.basename(util.replace_win_path(file))}")
    except ConnectionError as e:
        print("Connection error occured: ", e)
        return
    return path.dirname(file_selections[0])  # type: ignore


def update_file(img_id: str):
    api = util.get_api()

    try:
        response = requests.get(api + "/img", {"id": img_id}, timeout=5)
        response.raise_for_status()

    except (ConnectionError, requests.HTTPError) as e:
        print("Connection error occured: ", e)
        return
    resp = response.json()
    print("Current data: ")
    pprint(resp)

    artist = input("New artist (empty for no update): ").strip()
    path = input("New path (empty for no update): ").strip()
    type_img = util.ask_type("New type index (empty for no update): ", True).strip()
    while True:
        rating = input("New rating (empty for no update): ").lower().strip()
        if rating not in ["sfw", "nsfw", ""]:
            print("Only 'sfw' or 'nsfw' value allowed.")
        else:
            break

    metadata = {
        "id": img_id,
        "artist": (
            artist if (artist != resp["artist"]) and artist != "" else resp["artist"]
        ),
        "path": (
            util.replace_win_path(path)
            if path != resp["path"] and path != ""
            else resp["path"]
        ),
        "type": (
            type_img if type_img != resp["type"] and type_img != "" else resp["type"]
        ),
        "rating": (
            rating if rating != resp["rating"] and rating != "" else resp["rating"]
        ),
    }

    try:
        response = requests.post(api + "/database/update", json=metadata, timeout=5)
        response.raise_for_status()
        print("File updated.")
    except (ConnectionError, requests.HTTPError) as e:
        print("Connection error occured: ", e)
        return


def metadata_value():
    api = util.get_api()

    name = input("Key: ")
    value = input("Value: ")

    try:
        response = requests.post(
            api + "/metadata", params={"id": name, "value": value}, timeout=5
        )
        response.raise_for_status()
    except (ConnectionError, requests.HTTPError) as e:
        print("Connection error occured: ", e)
        return
    print("Value added/updated.")


def get_metadata_value():
    api = util.get_api()

    name = input("Key: ")

    try:
        response = requests.get(api + "/metadata/get", {"name": name}, timeout=5)
        response.raise_for_status()
        rp_json = response.json()
        print(f"ID: {rp_json["id"]}, Value: {rp_json["value"]}")
    except (ConnectionError, requests.HTTPError) as e:
        print("Connection error occured: ", e)
        return
    print("Value added/updated.")


def get_display_value():
    api = util.get_api()

    ID = input("File ID: ")

    try:
        response = requests.get(api + "/img", {"id": ID}, timeout=5)
        response.raise_for_status()
        rp_json = response.json()
        pprint(rp_json)
    except (ConnectionError, requests.HTTPError) as e:
        print("Connection error occured: ", e)
        return
