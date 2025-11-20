import requests
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path='../.env')


API_KEY = os.getenv("USDA_KEY")

def get_macros(query: str):
    url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    params = {
        "api_key": API_KEY,
        "query": query
    }
    resp = requests.get(url, params=params)
    data = resp.json()

    # if no foods found
    if "foods" not in data or len(data["foods"]) == 0:
        return None

    food = data["foods"][0]
    nutrients = food["foodNutrients"]

    macros = {"protein": 0, "carbs": 0, "fat": 0}

    for n in nutrients:
        name = n["nutrientName"]
        if name == "Protein":
            macros["protein"] = n["value"]
        elif name == "Carbohydrate, by difference":
            macros["carbs"] = n["value"]
        elif name == "Total lipid (fat)":
            macros["fat"] = n["value"]

    return (macros, len(data["foods"]))

while (True):
    food = input("Food type: ")
    if (food == '1'):
        break
    try:
        print(get_macros(str(food)))
    except Exception:
        print(Exception)
    finally:
        print("done")
