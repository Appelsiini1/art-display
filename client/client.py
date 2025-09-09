from sys import exit
from client_lib import add_file, update_file, metadata_value, get_metadata_value, get_display_value
from dotenv import load_dotenv

def menu():
    print("Select option:")
    print("1) Add file to database")
    print("2) Modify file in database")
    print("3) Delete file from database") # not implemented on server yet
    print("4) Add/Update settings value")
    print("5) Get settings value")
    print("6) Get display file metadata")
    print("0) Exit")
    while True:
        user_in = input("Selection: ")
        if user_in.strip().isdigit():
            user_in = int(user_in)
            break
        print("Selection was not a number. Please input your selection as an integer.")
    return user_in

def main():

    selection = -1
    init_dir = "C:/"

    print("Display file database client\n")
    while selection != 0:
        selection = menu()

        if (selection == 1):
            init_dir = add_file(init_dir)
            if not init_dir:
                init_dir = "C:/"
        elif (selection == 2):
            img_id = input("Image ID to update: ")
            update_file(img_id)
        elif (selection == 3):
            print("Not implemented.")
        elif (selection == 4):
            metadata_value()
        elif (selection == 5):
            get_metadata_value()
        elif (selection == 6):
            get_display_value()
        elif (selection == 0):
            print("Exiting...")
            exit(0)
        else:
            print("Unknown selection.")
        print()

if __name__ == "__main__" :
    load_dotenv(verbose=True)
    main()
