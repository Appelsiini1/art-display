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

    try:
        for file in file_selections:
            # Path prefix removal!!
            metadata = {
                "artist": artist,
                "path": file,
                "type": type_in,
                "rating": rating
            }
            
            response = requests.post(api+"/database/add", json=metadata, timeout=5)
            if response.status_code is not requests.codes.ok:
                print(f"Server responded with HTTP {response.status_code}. '{response.reason}', '{response.text}'")
                break
            else:
                print(f"OK - {file}")
    except ConnectionError as e:
        print("Connection error occured: ", e)
        return
    return path.dirname(file_selections[0])
  
def update_file(img_id:str):
    api = getenv("API_URL")
    if api == None:
        print("No server api URL defined.")
        return
    
    try:
        response = requests.post(api+"/img", {"id":img_id}, timeout=5)
        response.raise_for_status()
    except (ConnectionError, requests.HTTPError) as e:
        print("Connection error occured: ", e)
        return
    
    artist = input("New artist (empty for no update): ")
    path = input("New path (empty for no update): ")
    type_img = input("New type (empty for no update): ")
    while True:
        rating = input("New rating (empty for no update): ").lower()
        if rating not in ["sfw", "nsfw", ""]:
            print("Only 'sfw' or 'nsfw' value allowed.")
        else:
            break

    resp = response.json()
    metadata = {
        "id" : img_id,
        "artist": artist.strip() if artist.strip() != resp["artist"] else resp["artist"],
        "path": path.strip() if path.strip() != resp["path"] else resp["path"],
        "type": type_img.strip() if type_img.strip() != resp["type"] else resp["type"],
        "rating": rating.strip() if rating.strip() != resp["rating"] else resp["rating"],
    }

    try:
        response = requests.post(api+"/database/update", json=metadata, timeout=5)
    except ConnectionError as e:
        print("Connection error occured: ", e)
        return
