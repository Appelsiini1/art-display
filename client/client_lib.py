from tkinter import filedialog
import requests
from os import path, getenv

FILETYPES = (("Image files", [".png", ".jpg", ".jpeg", ".gif"]),)

def add_file(inital_dir:str):
    api = getenv("API_URL")
    if api == None:
        print("No server api URL defined.")
        return
    
    file_selections = filedialog.askopenfilenames(initialdir=inital_dir, title="Select file(s) to add", filetypes=FILETYPES)
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

    for file in file_selections:
        # Path prefix removal!!
        metadata = {
            "artist": artist,
            "path": file,
            "type": type_in,
            "rating": rating
        }
        
        response = requests.post(api+"/database/add", json=metadata)
        if response.status_code is not requests.codes.ok:
            print(f"Server responded with HTTP {response.status_code}. '{response.reason}', '{response.text}'")
            break
        else:
            print(f"OK - {file}")
            