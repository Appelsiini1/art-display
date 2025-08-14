from sys import exit
from client_lib import add_file
from dotenv import load_dotenv

def menu():
    print("Select option:")
    print("1) Add file to database")
    print("2) Modify file in database")
    print("3) Delete file from database") # not implemented on server yet
    print("4) Add metadata value")
    print("5) Modify metadata value")
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

    while selection != 0:
        selection = menu()

        if (selection == 1):
            pass
        elif (selection == 2):
            pass
        elif (selection == 3):
            pass
        elif (selection == 4):
            pass
        elif (selection == 5):
            pass
        elif (selection == 0):
            print("Exiting...")
            exit(0)
        else:
            print("Unknown selection.")

if __name__ == "__main__" :
    load_dotenv("./.env")
    main()
