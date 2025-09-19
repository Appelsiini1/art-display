from tkinter import filedialog, Tk
import requests
from os import path, getenv
from pprint import pprint
from typing import Literal

FILETYPES = (("Image files", [".png", ".jpg", ".jpeg", ".gif"]),)
IMAGE_TYPES = sorted(
    (
        "Pinup",
        "Porn",
        "Waist-up",
        "Comic",
        "Bust",
        "Fullbody",
        "Scene",
        "Photoshoot",
        "Chibi",
        "Wallpaper",
        "Other",
    )
)


#   artist: string;
#   path: string;
#   type: string;
#   rating: "sfw" | "nsfw";
class DISPLAY_FILE:
    def __init__(
        self,
        artist: str,
        path: str,
        type: Literal[
            "Pinup",
            "Porn",
            "Waist-up",
            "Comic",
            "Bust",
            "Fullbody",
            "Scene",
            "Photoshoot",
            "Chibi",
            "Wallpaper",
            "Other",
            "",
        ],
        rating: str,
    ) -> None:
        self.artist = artist
        self.path = path
        self.type = type
        self.rating = rating

    def __str__(self) -> str:
        return f"Artist: {self.artist}\nPath: {self.path}\nType: {self.type}\nRating: {self.rating}"


def get_api():
    api = getenv("IMG_API_URL")
    if api == None:
        raise ValueError("No server api URL defined.")
    return api


def replace_win_path(path: str):
    return path.replace("R:/", "")


def generate_img_type_print():
    txt = ""
    for i in range(1, len(IMAGE_TYPES) + 1):
        txt += f"{i}) {IMAGE_TYPES[i-1]}\n"
    return txt


def ask_filename(initial_dir: str):
    root = Tk()
    root.wm_attributes("-topmost", 1)
    root.withdraw()
    file_selections = filedialog.askopenfilenames(
        initialdir=initial_dir, title="Select file(s) to add", filetypes=FILETYPES
    )
    root.destroy()
    return file_selections


def ask_type(prompt: str, allow_empty=False):
    print(generate_img_type_print(), end="")
    type_name = ""
    while True:
        type_in = input(prompt)
        if type_in == "" and allow_empty:
            break
        elif type_in == "" and not allow_empty:
            print("Type index cannot be empty when adding.")
        elif not type_in.isnumeric():
            print("Type index is not a number.")
        elif int(type_in) not in list(range(1, len(IMAGE_TYPES) + 1)):
            print("Type index out of bounds. Try again.")

        else:
            type_name = IMAGE_TYPES[int(type_in) - 1]
            break
    return type_name


def add_file(initial_dir: str):
    api = get_api()

    file_selections = ask_filename(initial_dir)
    if not file_selections:
        print("No files selected or operation canceled.")
        return

    artist = input("Artist name: ")

    while True:
        rating = input("Rating (sfw | nsfw): ").lower()
        if rating not in ["sfw", "nsfw"]:
            print("Only 'sfw' or 'nsfw' value allowed.")
        else:
            break

    type_name = ask_type("Image type index: ")
    df = DISPLAY_FILE(
        artist,
        "(multiple values)" if len(file_selections) > 1 else file_selections[0],  # type: ignore
        type_name,
        rating,
    )

    print()
    print(str(df))
    confirm = input("Confirm selections (y/n): ")
    if confirm.strip() != "y" and confirm.strip() != "":
        print("Operation canceled.")
        return

    try:
        for file in file_selections:
            metadata = {
                "artist": artist,
                "path": replace_win_path(file.strip()),
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
                print(f"OK - {path.basename(replace_win_path(file))}")
    except ConnectionError as e:
        print("Connection error occured: ", e)
        return
    return path.dirname(file_selections[0])  # type: ignore


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
    type_img = ask_type("New type index (empty for no update): ", True).strip()
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
