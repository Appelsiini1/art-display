from tkinter import filedialog, Tk
import requests
from os import path, getenv
from pprint import pprint

FILETYPES = (("Image files", [".png", ".jpg", ".jpeg", ".gif"]),)


def get_api():
    api = getenv("IMG_API_URL")
    if api == None:
        raise ValueError("No server api URL defined.")
    return api


def replace_win_path(path: str):
    return path.replace("R:/", "")


def add_file(inital_dir: str):
    api = get_api()

    root = Tk()
    root.wm_attributes("-topmost", 1)
    root.withdraw()
    file_selections = filedialog.askopenfilenames(
        initialdir=inital_dir, title="Select file(s) to add", filetypes=FILETYPES
    )
    root.destroy()
    if not file_selections:
        print("No files selected or operation canceled.")
        return

    #   artist: string;
    #   path: string;
    #   type: string;
    #   rating: "sfw" | "nsfw";
    artist = input("Artist name: ")

    while True:
        rating = input("Rating (sfw | nsfw): ").lower()
        if rating not in ["sfw", "nsfw"]:
            print("Only 'sfw' or 'nsfw' value allowed.")
        else:
            break

    type_in = input("Image type: ")

    try:
        for file in file_selections:
            metadata = {
                "artist": artist,
                "path": replace_win_path(file.strip()),
                "type": type_in,
                "rating": rating,
            }

            response = requests.post(api + "/database/add", json=metadata, timeout=5)
            if response.status_code is not requests.codes.ok:
                print(
                    f"Server responded with HTTP {response.status_code}. '{response.reason}', '{response.text}'"
                )
                break
            else:
                print(f"OK - {path.basename(replace_win_path(file))}")
    except ConnectionError as e:
        print("Connection error occured: ", e)
        return
    return path.dirname(file_selections[0])


def update_file(img_id: str):
    api = get_api()

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
    type_img = input("New type (empty for no update): ").strip()
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
            replace_win_path(path)
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
    api = get_api()

    name = input("Key: ")
    value = input("Value: ")

    try:
        response = requests.post(
            api + "/metadata", {"id": name, "value": value}, timeout=5
        )
        response.raise_for_status()
    except (ConnectionError, requests.HTTPError) as e:
        print("Connection error occured: ", e)
        return
    print("Value added/updated.")


def get_metadata_value():
    api = get_api()

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
    api = get_api()

    ID = input("File ID: ")

    try:
        response = requests.get(api + "/img", {"id": ID}, timeout=5)
        response.raise_for_status()
        rp_json = response.json()
        pprint(rp_json)
    except (ConnectionError, requests.HTTPError) as e:
        print("Connection error occured: ", e)
        return
