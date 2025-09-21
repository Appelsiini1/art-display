from os import getenv
from tkinter import filedialog, Tk
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
RATING = ["sfw", "nsfw"]


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


class PREVIOUS_PROPERTY:
    def __init__(self, value) -> None:
        self.prop = value

    @property
    def prop(self):
        return self._prop

    @prop.setter
    def prop(self, value):
        self._prop = value


PREV_ARTIST = PREVIOUS_PROPERTY("")
PREV_TYPE_IN = PREVIOUS_PROPERTY(0)
PREV_RATING = PREVIOUS_PROPERTY(0)


def get_api():
    api = getenv("IMG_API_URL")
    if api == None:
        raise ValueError("No server api URL defined.")
    return api


def get_replace_path():
    rp_path = getenv("PATH_TO_REPLACE")
    if rp_path == None:
        raise ValueError("No replace path defined.")
    return rp_path


def replace_win_path(path: str):
    return path.replace(get_replace_path(), "")


def generate_menu_print(menu_list: list | tuple):
    txt = ""
    for i in range(1, len(menu_list) + 1):
        txt += f"{i}) {menu_list[i-1]}\n"
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


def check_menu_selection(
    base_selection: str,
    prompt: str,
    allow_empty: bool,
    selection_list: list,
    previous: PREVIOUS_PROPERTY,
):
    selection = base_selection
    if not allow_empty and selection and not selection.isdigit():
        try:
            previous.prop = str(selection_list.index(selection) + 1)  # type: ignore
            selection = previous.prop
        except ValueError:
            raise ValueError("Unknown value, try again.")
    elif not allow_empty and selection and selection.isdigit():
        previous.prop = selection
    if selection == "" and allow_empty:
        pass
    elif selection == "" and not allow_empty:
        raise ValueError(f"{prompt} cannot be empty when adding.")
    elif not selection.isnumeric():
        raise ValueError(f"{prompt} is not a number.")
    elif int(selection) not in list(range(1, len(selection_list) + 1)):
        raise ValueError(f"{prompt} out of bounds. Try again.")
    return selection


def ask_type(prompt: str, allow_empty=False):
    print("Type:")
    print(generate_menu_print(IMAGE_TYPES), end="")
    type_name = ""
    while True:
        type_in = (
            ask_with_previous(
                prompt,
                IMAGE_TYPES[int(PREV_TYPE_IN.prop) - 1] if PREV_TYPE_IN.prop else "",
            )
            if not allow_empty
            else input(prompt)
        )

        try:
            res = check_menu_selection(
                type_in, "Type selection", allow_empty, IMAGE_TYPES, PREV_TYPE_IN
            )
        except ValueError as e:
            print(e)
            continue
        if res:
            type_name = IMAGE_TYPES[int(res) - 1]
            break
    return type_name


def ask_with_previous(prompt: str, prev: str):
    prop = ""
    if not prev:
        prop = input(f"{prompt}: ")
    else:
        tmp = input(f"{prompt} (empty for '{prev}'): ")
        if not tmp:
            prop = prev
        else:
            prop = tmp
    return prop


def ask_rating():
    while True:
        print("Rating:")
        print(generate_menu_print(RATING), end="")
        tmp = ask_with_previous(
            "Rating number",
            RATING[int(PREV_RATING.prop) - 1] if PREV_RATING.prop else "",
        )

        try:
            res = check_menu_selection(
                tmp, "Rating selection", False, RATING, PREV_RATING
            )
        except ValueError as e:
            print(e)
            continue
        rating = RATING[int(res) - 1]
        break
    return rating


def ask_artist():
    artist = ask_with_previous("Artist name", PREV_ARTIST.prop)
    PREV_ARTIST.prop = artist
    return artist
