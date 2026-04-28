import json
import os

COLLECTION_PATH = "lorapok-api-atlas/src/data/api_collection.json"
OUTPUT_PATH = "lorapok-api-atlas/src/data/api_collection.json"

# Comprehensive stable mirrors and fixed endpoints
API_REPAIRS = {
    "Free Dictionary API": "https://api.dictionaryapi.dev/api/v2/entries/en/hello",
    "Bible API": "https://bible-api.com/john 3:16",
    "Al-Quran Cloud": "https://api.alquran.cloud/v1/ayah/262",
    "SpaceX Latest Launch": "https://api.spacexdata.com/v4/launches/latest",
    "International Space Station Location": "http://api.open-notify.org/iss-now.json",
    "Shibe.online": "https://shibe.online/api/shibes?count=1&urls=true&httpsUrls=true",
    "Robohash Avatar": "https://robohash.org/lorapok",
    "Random Quote (Quotable)": "https://zenquotes.io/api/random",
    "Kanye Rest (Quotes)": "https://api.kanye.rest",
    "Breaking Bad Quotes": "https://api.breakingbadquotes.xyz/v1/quotes",
    "Anime Quotes (AnimeChan)": "https://animechan.xyz/api/random",
    "YesNo.wtf API": "https://yesno.wtf/api",
    "Jikan API (Anime Search)": "https://api.jikan.moe/v4/random/anime",
    "iTunes Search (Music)": "https://itunes.apple.com/search?term=jack+johnson&limit=1",
    "Lyrics.ovh (Random)": "https://api.lyrics.ovh/v1/Coldplay/Adventure%20of%20a%20Lifetime",
    "Nominatim (OpenStreetMap Search)": "https://nominatim.openstreetmap.org/search?q=London&format=json",
    "Sunrise-Sunset API": "https://api.sunrise-sunset.org/json?lat=36.7201600&lng=-4.4203400",
    "Abstract Geolocation (Free Tier)": "https://ipgeolocation.abstractapi.com/v1/?api_key=FREE_KEY",
    "Art Institute of Chicago": "https://api.artic.edu/api/v1/artworks/129693",
    "Met Museum API": "https://collectionapi.metmuseum.org/public/collection/v1/objects/436535",
    "Harvard Art Museums": "https://api.harvardartmuseums.org/object/287354?apikey=YOUR_API_KEY",
    "ExchangeRate-API (Free)": "https://open.er-api.com/v6/latest/USD",
    "Binance 24h Ticker": "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT",
    "Wall Street Bets API": "https://tradestie.com/api/v1/apps/reddit",
    "UUID Generator": "https://httpbin.org/uuid",
    "JSONPlaceholder (Users)": "https://jsonplaceholder.typicode.com/users",
    "Free-Geo-IP": "https://freegeoip.app/json/",
    "MyMemory Translation": "https://api.mymemory.translated.net/get?q=Hello&langpair=en|it",
    "Open Trivia DB": "https://opentdb.com/api.php?amount=1",
    "Free-To-Game API": "https://www.freetogame.com/api/games",
    "CheapShark (Game Deals)": "https://www.cheapshark.com/api/1.0/deals?upperPrice=15",
    "Foodish (Random Food Image)": "https://foodish-api.com/api",
    "Random Coffee": "https://coffee.alexwohlbruck.com/api/random",
    "Teleport (City Quality of Life)": "https://api.teleport.org/api/cities/",
    "Bike Index (Search Stolen Bikes)": "https://bikeindex.org/api/v3/search",
    "Disease.sh (Global Health Data)": "https://disease.sh/v3/covid-19/all",
    "Open AQ (Air Quality)": "https://api.openaq.org/v2/locations",
    "Yoda Translation": "https://api.funtranslations.com/translate/yoda.json?text=I+am+Lorapok",
    "Lorem Picsum (Random Images)": "https://picsum.photos/v2/list",
    "BallDontLie (NBA Stats)": "https://www.balldontlie.io/api/v1/players/237",
    "Football-Data.org (Sample)": "https://api.football-data.org/v4/competitions",
    "NHTSA VIN Decoder": "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/5UXWX7C5*BA?format=json",
    "OpenSky Network (Flights)": "https://opensky-network.org/api/states/all",
    "Gutendex (Project Gutenberg)": "https://gutendex.com/books/",
    "Google Books Search": "https://www.googleapis.com/books/v1/volumes?q=isbn:0747532699",
    "Mocky.io (Sample)": "https://run.mocky.io/v3/8040d750-f92b-42e1-8f81-9b16893630f6",
    "Beeceptor (Mock Endpoints)": "https://echo.beeceptor.com",
    "Fake Store API (Platzi)": "https://fakestoreapi.com/products/1",
    "Open Library Covers": "https://covers.openlibrary.org/b/id/240727-S.jpg",
    "Get Random Cat Fact": "https://catfact.ninja/fact",
    "Get Bitcoin Price (CoinGecko)": "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    "Get Public IP (IPify)": "https://api.ipify.org?format=json",
    "Predict Age by Name (Agify)": "https://api.agify.io?name=michael",
    "Random Joke (Official Joke API)": "https://official-joke-api.appspot.com/random_joke",
    "Get University Data (Hipolabs)": "http://universities.hipolabs.com/search?country=United+States",
    "Get Random Dog Image (Dog CEO)": "https://dog.ceo/api/breeds/image/random",
    "Get Pokemon Info (PokeAPI)": "https://pokeapi.co/api/v2/pokemon/ditto",
    "Predict Gender by Name (Genderize)": "https://api.genderize.io?name=luc",
    "Get Random User Data (RandomUser.me)": "https://randomuser.me/api/",
    "Get Country Info (REST Countries)": "https://restcountries.com/v3.1/name/united",
    "Get Rick and Morty Character": "https://rickandmortyapi.com/api/character/1",
    "Get NASA Astronomy Picture (NASA APOD)": "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY",
    "Get Fake Post (JSONPlaceholder)": "https://jsonplaceholder.typicode.typicode.com/posts/1",
    "Get Book Data (Open Library)": "https://openlibrary.org/works/OL45804W.json",
    "Search TV Shows (TV Maze)": "https://api.tvmaze.com/search/shows?q=girls",
    "Get Ethereum Price (CoinGecko)": "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
    "Get Random Advice (Advice Slip)": "https://api.adviceslip.com/advice",
    "Math Fact (Numbers API)": "http://numbersapi.com/random/math",
    "Get Star Wars Character (SWAPI)": "https://swapi.py4e.com/api/people/1/",
    "Get D&D Monster (D&D 5e API)": "https://www.dnd5eapi.co/api/monsters/aboleth",
    "Get Food Product (Open Food Facts)": "https://world.openfoodfacts.org/api/v0/product/737628064502.json",
    "Zip Code Info (Zippopotam.us)": "http://api.zippopotamus.us/us/90210",
    "Get Crypto Ticker (CoinLore)": "https://api.coinlore.net/api/ticker/?id=90",
    "Public Holidays (Nager.Date)": "https://date.nager.at/api/v3/PublicHolidays/2023/US",
    "Shuffle New Deck (Deck of Cards)": "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1",
    "HTTP Echo (HTTPBin)": "https://httpbin.org/get",
    "Predict Nationality (Nationalize.io)": "https://api.nationalize.io?name=nathaniel",
    "Currency Rates (Frankfurter)": "https://api.frankfurter.app/latest",
    "Weather Forecast (7Timer!)": "https://www.7timer.info/bin/astro.php?lon=113.2&lat=23.1&ac=0&unit=metric&output=json&tzshift=0",
    "User List (ReqRes)": "https://reqres.in/api/users?page=2",
    "Get GitHub User Info": "https://api.github.com/users/octocat",
    "Search Breweries (Open Brewery DB)": "https://api.openbrewerydb.org/v1/breweries?by_city=san_diego&per_page=3",
    "Random Cocktail (The Cocktail DB)": "https://www.thecocktaildb.com/api/json/v1/1/random.php",
    "Random Meal (The Meal DB)": "https://www.themealdb.com/api/json/v1/1/random.php",
    "Potter Characters (Potter DB)": "https://api.potterdb.com/v1/characters",
    "Disney Characters (Disney API)": "https://api.disneyapi.dev/character",
    "IP Geolocation (IP-API)": "http://ip-api.com/json/",
    "Search Libraries (CDNJS)": "https://api.cdnjs.com/libraries?search=jquery",
    "StackOverflow Tags": "https://api.stackexchange.com/2.3/tags?order=desc&sort=popular&site=stackoverflow",
    "Explore Projects (GitLab)": "https://gitlab.com/api/v4/projects",
    "City Weather (OpenWeather Sample)": "https://api.openweathermap.org/data/2.5/weather?q=London&appid=b1b15e88fa797225412465268487a38a",
    "Predict Age by Name": "https://api.agify.io?name=bella",
    "Find Something to Do (Bored API)": "https://www.boredapi.com/api/activity",
    "Top Coins by Volume (CryptoCompare)": "https://min-api.cryptocompare.com/data/top/totalvolfull?limit=10&tsym=USD",
    "Get Bitcoin Assets (CoinCap)": "https://api.coincap.io/v2/assets/bitcoin",
    "US Population Data (Data USA)": "https://datausa.io/api/data?drilldowns=Nation&measures=Population",
    "True Random Integers (Random.org)": "https://www.random.org/integers/?num=1&min=1&max=100&col=1&base=10&format=plain&rnd=new",
    "Placeholder Image URL": "https://picsum.photos/200/300",
    "Current Time (World Time API)": "http://worldtimeapi.org/api/timezone/Etc/UTC",
    "Get Emoji Info": "https://emoji-api.com/emojis?access_key=API_KEY",
    "Base64 Decode Tool": "https://httpbin.org/base64/SFRUUEJJTiBpcyBhd2Vzb21l",
    "Geek Joke": "https://geek-jokes.sameerkumar.website/api?format=json",
    "Chuck Norris Fact": "https://api.chucknorris.io/jokes/random",
    "Programming Joke (JokeAPI)": "https://v2.jokeapi.dev/joke/Programming?type=single",
    "Random Dad Joke (icanhazdadjoke)": "https://icanhazdadjoke.com/",
    "Evil Insult Generator": "https://evilinsult.com/generate_insult.php?lang=en&type=json",
    "Open-Meteo (Weather)": "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true",
    "DexScreener (Token Info)": "https://api.dexscreener.com/latest/dex/tokens/0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    "The Color API": "https://www.thecolorapi.com/id?hex=00FF00",
    "Giphy Search": "https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=funny&limit=1",
    "API Status Check": "https://apistatuscheck.com/api/v1/status/github",
    "Instatus Pages": "https://api.instatus.com/v1/pages",
    "GitHub Repo Details": "https://api.github.com/repos/facebook/react",
    "GitLab Project Search": "https://gitlab.com/api/v4/projects?search=atlas",
    "Google Fonts API": "https://www.googleapis.com/webfonts/v1/webfonts?key=YOUR_API_KEY"
}

API_AUTH_LINKS = {
    "Abstract Geolocation (Free Tier)": "https://app.abstractapi.com/users/signup",
    "Harvard Art Museums": "https://www.harvardartmuseums.org/collections/api",
    "Get NASA Astronomy Picture (NASA APOD)": "https://api.nasa.gov/",
    "City Weather (OpenWeather Sample)": "https://home.openweathermap.org/users/sign_up",
    "Get Emoji Info": "https://emoji-api.com/",
    "Groq AI (Llama 3)": "https://console.groq.com/keys",
    "OpenRouter (Unified AI)": "https://openrouter.ai/keys",
    "Unsplash (Photos)": "https://unsplash.com/developers",
    "TMDB (Trending Movies)": "https://www.themoviedb.org/settings/api",
    "NASA Mars Rover Photos": "https://api.nasa.gov/",
    "NewsAPI Top Headlines": "https://newsapi.org/register",
    "Smithsonian Open Access": "https://www.si.edu/openaccess/devtools",
    "Europeana Culture Search": "https://pro.europeana.eu/page/get-an-api-key",
    "USDA Nutrition Search": "https://fdc.nal.usda.gov/api-key-signup.html",
    "GlobalGiving Projects": "https://www.globalgiving.org/api/",
    "Pantry (JSON Storage)": "https://getpantry.cloud/",
    "Giphy Search": "https://developers.giphy.com/dashboard/",
    "Instatus Pages": "https://instatus.com/developers",
    "Google Fonts API": "https://developers.google.com/fonts/docs/developer_api",
    "GitHub Repo Details": "https://docs.github.com/en/rest",
    "GitLab Project Search": "https://docs.gitlab.com/ee/api/",
    "API Status Check": "https://apistatuscheck.com/"
}

def repair_item(item):
    name = item.get("name")
    
    if name in API_AUTH_LINKS:
        item["authLink"] = API_AUTH_LINKS[name]

    if name in API_REPAIRS:
        url = API_REPAIRS[name]
        if "request" not in item:
            item["request"] = {"method": "GET", "header": []}
        
        item["request"]["url"] = {
            "raw": url,
            "protocol": url.split("://")[0] if "://" in url else "https",
            "host": url.split("://")[1].split("/")[0].split(".") if "://" in url else url.split("/")[0].split("."),
            "path": url.split("://")[1].split("/")[1:] if "://" in url and "/" in url.split("://")[1] else []
        }
        
        if "?" in url:
            path_part = item["request"]["url"]["path"][-1] if item["request"]["url"]["path"] else ""
            if "?" in path_part:
                clean_path = path_part.split("?")[0]
                query_str = path_part.split("?")[1]
                if item["request"]["url"]["path"]:
                    item["request"]["url"]["path"][-1] = clean_path
                
                query_params = []
                for param in query_str.split("&"):
                    if "=" in param:
                        k, v = param.split("=")
                        query_params.append({"key": k, "value": v})
                item["request"]["url"]["query"] = query_params

    if "item" in item:
        for sub_item in item["item"]:
            repair_item(sub_item)

def main():
    if not os.path.exists(COLLECTION_PATH):
        print(f"Error: {COLLECTION_PATH} not found.")
        return

    with open(COLLECTION_PATH, "r") as f:
        collection = json.load(f)

    categories = []
    loose_requests = []

    if "item" in collection:
        for item in collection["item"]:
            repair_item(item)
            if "item" in item:
                categories.append(item)
            else:
                loose_requests.append(item)

    if loose_requests:
        categories.append({
            "name": "General & Misc",
            "item": loose_requests
        })

    collection["item"] = categories

    with open(OUTPUT_PATH, "w") as f:
        json.dump(collection, f, indent=2)

    print(f"Repaired collection saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
