#!/usr/bin/env python3
"""Generate data/practice.sql: a small practice database used by the in-browser SQL runner.

The data is a small, made-up sample shaped like the datasets the lessons talk about
(films, world countries, European soccer, a soccer season table, and a retail store),
so most lesson examples can be run as-is. Numbers will differ from the lesson's
"sample output" tables, which were taken from much larger datasets.

Usage:  python3 tools/build_db.py   (writes data/practice.sql)
"""
import random
import sqlite3
from pathlib import Path

random.seed(42)
OUT = Path(__file__).resolve().parent.parent / "data" / "practice.sql"

sql = []


def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, (int, float)):
        return repr(v)
    return "'" + str(v).replace("'", "''") + "'"


def table(name, ddl, rows):
    sql.append(f"CREATE TABLE {name} ({ddl});")
    for i in range(0, len(rows), 50):
        chunk = rows[i:i + 50]
        vals = ",\n".join("(" + ", ".join(q(v) for v in r) + ")" for r in chunk)
        sql.append(f"INSERT INTO {name} VALUES\n{vals};")


# ---------------------------------------------------------------- films
films = [
    # title, year, country, duration, language, cert, budget
    ("The Godfather", 1972, "USA", 175, "English", "R", 6000000),
    ("Gone with the Wind", 1939, "USA", 238, "English", "G", 3977000),
    ("Das Boot", 1981, "Germany", 149, "German", "R", 14000000),
    ("Wings of Desire", 1987, "Germany", 128, "German", "PG-13", 2500000),
    ("Cinema Paradiso", 1988, "Italy", 155, "Italian", "R", 5000000),
    ("Jurassic Park", 1993, "USA", 127, "English", "PG-13", 63000000),
    ("Forrest Gump", 1994, "USA", 142, "English", "PG-13", 55000000),
    ("The Lion King", 1994, "USA", 88, "English", "G", 45000000),
    ("Pulp Fiction", 1994, "USA", 154, "English", "R", 8000000),
    ("Toy Story", 1995, "USA", 81, "English", "G", 30000000),
    ("Titanic", 1997, "USA", 194, "English", "PG-13", 200000000),
    ("Life Is Beautiful", 1997, "Italy", 116, "Italian", "PG-13", 20000000),
    ("Run Lola Run", 1998, "Germany", 81, "German", "R", 1750000),
    ("The Matrix", 1999, "USA", 136, "English", "R", 63000000),
    ("Notting Hill", 1999, "UK", 124, "English", "PG-13", 42000000),
    ("Crouching Tiger, Hidden Dragon", 2000, "China", 120, "Mandarin", "PG-13", 17000000),
    ("Amélie", 2001, "France", 122, "French", "R", 10000000),
    ("Spirited Away", 2001, "Japan", 125, "Japanese", "PG", 19000000),
    ("Lagaan", 2001, "India", 224, "Hindi", "PG", 6000000),
    ("Pan's Labyrinth", 2006, "Mexico", 118, "Spanish", "R", 19000000),
    ("Volver", 2006, "Spain", 121, "Spanish", "R", 9400000),
    ("The Orphanage", 2007, "Spain", 105, "Spanish", "R", 4000000),
    ("The Dark Knight", 2008, "USA", 152, "English", "PG-13", 185000000),
    ("Avatar", 2009, "USA", 162, "English", "PG-13", 237000000),
    ("3 Idiots", 2009, "India", 170, "Hindi", "PG-13", 8000000),
    ("Inception", 2010, "USA", 148, "English", "PG-13", 160000000),
    ("The King's Speech", 2010, "UK", 118, "English", "R", 15000000),
    ("The Intouchables", 2011, "France", 112, "French", "R", 13000000),
    ("Skyfall", 2012, "UK", 143, "English", "PG-13", 200000000),
    ("Gravity", 2013, "USA", 91, "English", "PG-13", 100000000),
    ("Interstellar", 2014, "USA", 169, "English", "PG-13", 165000000),
    ("Mad Max: Fury Road", 2015, "Australia", 120, "English", "R", 150000000),
    ("Baahubali: The Beginning", 2015, "India", 159, "Telugu", None, 18000000),
    ("Spectre", 2015, "UK", 148, "English", "PG-13", 245000000),
    ("Dangal", 2016, "India", 161, "Hindi", None, 10000000),
    ("Elle", 2016, "France", 130, "French", "R", None),
    ("Toni Erdmann", 2016, "Germany", 162, "German", "R", None),
    ("Black Panther", 2018, "USA", 134, "English", "PG-13", 200000000),
    ("Roma", 2018, "Mexico", 135, "Spanish", "R", 15000000),
    ("Avengers: Endgame", 2019, "USA", 181, "English", "PG-13", 356000000),
    ("Joker", 2019, "USA", 122, "English", "R", 55000000),
    ("Parasite", 2019, "South Korea", 132, "Korean", "R", 11400000),
    ("Once Upon a Time in Hollywood", 2019, "USA", 161, "English", "R", 90000000),
    ("1917", 2019, "UK", 119, "English", "R", 95000000),
    ("Tenet", 2020, "USA", 150, "English", "PG-13", 200000000),
    ("Soul", 2020, "USA", 100, "English", "PG", 150000000),
    ("Untitled Festival Short", 2020, "New Zealand", None, None, None, None),
    ("Silent Archive", 2017, "Canada", 95, None, "Unrated", 1200000),
]
film_rows = []
for i, (t, y, c, d, lang, cert, b) in enumerate(films, 1):
    gross = int(b * random.uniform(0.6, 6)) if b else None
    film_rows.append((i, t, y, c, d, lang, cert, gross, b))
table("films", "id INTEGER PRIMARY KEY, title TEXT, release_year INTEGER, country TEXT, "
      "duration INTEGER, language TEXT, certification TEXT, gross INTEGER, budget INTEGER", film_rows)

people = [
    ("Aaron Paul", "1979-08-27", None), ("Alan Rickman", "1946-02-21", "2016-01-14"),
    ("Angelina Jolie", "1975-06-04", None), ("Audrey Hepburn", "1929-05-04", "1993-01-20"),
    ("Ben Affleck", "1972-08-15", None), ("Brad Pitt", "1963-12-18", None),
    ("Bruce Willis", "1955-03-19", None), ("Chadwick Boseman", "1976-11-29", "2020-08-28"),
    ("Dwayne Johnson", "1972-05-02", None), ("Emma Watson", "1990-04-15", None),
    ("Heath Ledger", "1979-04-04", "2008-01-22"), ("Kate Winslet", "1975-10-05", None),
    ("Leonardo DiCaprio", "1974-11-11", None), ("Marlon Brando", "1924-04-03", "2004-07-01"),
    ("Matt Damon", "1970-10-08", None), ("Michael Caine", "1933-03-14", None),
    ("Morgan Freeman", "1937-06-01", None), ("Robin Williams", "1951-07-21", "2014-08-11"),
    ("Samuel L. Jackson", "1948-12-21", None), ("Scarlett Johansson", "1984-11-22", None),
    ("Tom Hanks", "1956-07-09", None), ("Wes Anderson", "1969-05-01", None),
    ("Zendaya", "1996-09-01", None), ("Jamie Lee Curtis", None, None),
]
table("people", "id INTEGER PRIMARY KEY, name TEXT, birthdate TEXT, deathdate TEXT",
      [(i, *p) for i, p in enumerate(people, 1)])

reviews = []
for i, f in enumerate(film_rows, 1):
    reviews.append((i, f[0], random.randint(200, 4000), random.randint(50, 800),
                    round(random.uniform(5.5, 9.3), 1), random.randint(20000, 2000000),
                    random.choice([random.randint(100, 999), random.randint(1000, 40000)])))
table("reviews", "id INTEGER PRIMARY KEY, film_id INTEGER, num_user INTEGER, num_critic INTEGER, "
      "imdb_score REAL, num_votes INTEGER, facebook_likes INTEGER", reviews)

# ---------------------------------------------------------------- world
countries = [
    # code, name, continent, region, capital, indep_year, surface_area
    ("JPN", "Japan", "Asia", "East Asia", "Tokyo", -660, 377829),
    ("CHN", "China", "Asia", "East Asia", "Beijing", -1523, 9572900),
    ("IND", "India", "Asia", "Southern and Central Asia", "New Delhi", 1947, 3287263),
    ("PAK", "Pakistan", "Asia", "Southern and Central Asia", "Islamabad", 1947, 796095),
    ("NPL", "Nepal", "Asia", "Southern and Central Asia", "Kathmandu", 1769, 147181),
    ("SGP", "Singapore", "Asia", "Southeast Asia", "Singapore", 1965, 618),
    ("SAU", "Saudi Arabia", "Asia", "Middle East", "Riyadh", 1932, 2149690),
    ("ARE", "United Arab Emirates", "Asia", "Middle East", "Abu Dhabi", 1971, 83600),
    ("ISR", "Israel", "Asia", "Middle East", "Jerusalem", 1948, 21056),
    ("JOR", "Jordan", "Asia", "Middle East", "Amman", 1946, 88946),
    ("FRA", "France", "Europe", "Western Europe", "Paris", 843, 551500),
    ("DEU", "Germany", "Europe", "Western Europe", "Berlin", 1955, 357022),
    ("GBR", "United Kingdom", "Europe", "British Islands", "London", 1066, 242900),
    ("ITA", "Italy", "Europe", "Southern Europe", "Rome", 1861, 301316),
    ("ESP", "Spain", "Europe", "Southern Europe", "Madrid", 1492, 505992),
    ("USA", "United States", "North America", "North America", "Washington", 1776, 9363520),
    ("CAN", "Canada", "North America", "North America", "Ottawa", 1867, 9970610),
    ("MEX", "Mexico", "North America", "Central America", "Mexico City", 1810, 1958201),
    ("BRA", "Brazil", "South America", "South America", "Brasilia", 1822, 8547403),
    ("ARG", "Argentina", "South America", "South America", "Buenos Aires", 1816, 2780400),
    ("EGY", "Egypt", "Africa", "Northern Africa", "Cairo", 1922, 1001449),
    ("NGA", "Nigeria", "Africa", "Western Africa", "Abuja", 1960, 923768),
    ("AUS", "Australia", "Oceania", "Australia and New Zealand", "Canberra", 1901, 7741220),
    ("NZL", "New Zealand", "Oceania", "Australia and New Zealand", "Wellington", 1907, 270534),
    ("FJI", "Fiji Islands", "Oceania", "Melanesia", "Suva", 1970, 18274),
    ("PNG", "Papua New Guinea", "Oceania", "Melanesia", "Port Moresby", 1975, 462840),
    ("ASM", "American Samoa", "Oceania", "Polynesia", "Pago Pago", None, 199),
    ("GUM", "Guam", "Oceania", "Micronesia", "Agana", None, 549),
    ("NRU", "Nauru", "Oceania", "Micronesia", "Yaren", 1968, 21),
    ("TKL", "Tokelau", "Oceania", "Polynesia", "Fakaofo", None, 12),
]
table("countries", "code TEXT PRIMARY KEY, name TEXT, continent TEXT, region TEXT, capital TEXT, "
      "indep_year INTEGER, surface_area REAL", countries)

cities = [
    ("Tokyo", "JPN", 13960000.0, 37843000.0), ("Osaka", "JPN", 2691000.0, 19342000.0),
    ("Shanghai", "CHN", 24256800.0, 34750000.0), ("Beijing", "CHN", 21516000.0, 24900000.0),
    ("Delhi", "IND", 11034555.0, 26495000.0), ("Mumbai", "IND", 12442373.0, 20748395.0),
    ("Karachi", "PAK", 14910352.0, 25400000.0), ("Lahore", "PAK", 11126285.0, None),
    ("Singapore", "SGP", 5535000.0, None), ("Riyadh", "SAU", 6506700.0, 7676654.0),
    ("Dubai", "ARE", 2643410.0, 4560000.0), ("Paris", "FRA", 2244000.0, 12405426.0),
    ("Berlin", "DEU", 3517424.0, 5871022.0), ("London", "GBR", 8673713.0, 13879757.0),
    ("Rome", "ITA", 2877215.0, 4353775.0), ("Madrid", "ESP", 3141991.0, 6240000.0),
    ("Barcelona", "ESP", 1604555.0, 5375774.0), ("New York City", "USA", 8550405.0, 20182305.0),
    ("Washington", "USA", 681170.0, 6131977.0), ("Los Angeles", "USA", 3884307.0, 12828837.0),
    ("Toronto", "CAN", 2731571.0, 6054191.0), ("Ottawa", "CAN", 934243.0, 1323783.0),
    ("Mexico City", "MEX", 8974724.0, 20063000.0), ("Sao Paulo", "BRA", 12038175.0, 21090792.0),
    ("Buenos Aires", "ARG", 3054300.0, 14122000.0), ("Cairo", "EGY", 10230350.0, 22439541.0),
    ("Lagos", "NGA", 16060303.0, None), ("Sydney", "AUS", 4840600.0, 5005400.0),
    ("Hong Kong", "HKG", 7347000.0, None),
]
table("cities", "name TEXT, country_code TEXT, city_proper_pop REAL, metroarea_pop REAL", cities)

lang = {
    "JPN": [("Japanese", 99.1, True)], "CHN": [("Mandarin", 70.6, True), ("Cantonese", 5.0, False)],
    "IND": [("Hindi", 43.6, True), ("Bengali", 8.0, False), ("Telugu", 6.7, False),
            ("Bhojpuri", 4.2, False), ("Urdu", 4.2, False), ("English", 0.02, True)],
    "PAK": [("Urdu", 7.6, True), ("Punjabi", 48.0, False), ("Sindhi", 12.0, False),
            ("English", None, True)],
    "NPL": [("Nepali", 44.6, True), ("Maithili", 11.7, False), ("Bhojpuri", 6.0, False)],
    "SGP": [("English", 36.9, True), ("Mandarin", 34.9, True), ("Malay", 10.7, True), ("Tamil", 3.3, True)],
    "SAU": [("Arabic", 100.0, True)], "ARE": [("Arabic", None, True), ("English", None, False), ("Hindi", None, False)],
    "ISR": [("Hebrew", 63.1, True), ("Arabic", 18.0, False), ("Russian", 8.9, False)],
    "JOR": [("Arabic", 98.0, True), ("English", None, False)],
    "FRA": [("French", 100.0, True)], "DEU": [("German", 95.0, True), ("Turkish", 1.8, False)],
    "GBR": [("English", 98.0, True), ("Welsh", 0.6, False)], "ITA": [("Italian", 94.1, True)],
    "ESP": [("Spanish", 74.0, True), ("Catalan", 17.0, False)],
    "USA": [("English", 79.2, True), ("Spanish", 13.0, False)],
    "CAN": [("English", 58.7, True), ("French", 22.0, True)], "MEX": [("Spanish", 92.7, True)],
    "BRA": [("Portuguese", 97.5, True)], "ARG": [("Spanish", 96.8, True)],
    "EGY": [("Arabic", 98.0, True)], "NGA": [("English", None, True), ("Hausa", 30.0, False)],
    "AUS": [("English", 76.8, True)], "NZL": [("English", 89.8, True), ("Maori", 3.5, True)],
    "FJI": [("Fijian", 50.8, True), ("Hindi", 43.7, False)], "PNG": [("Tok Pisin", None, True)],
}
lrows, lid = [], 1
for code, ls in lang.items():
    for name, pct, off in ls:
        lrows.append((lid, code, name, pct, 1 if off else 0))
        lid += 1
table("languages", "lang_id INTEGER PRIMARY KEY, code TEXT, name TEXT, percent REAL, official INTEGER", lrows)

gdp = {"JPN": 44000, "CHN": 6000, "IND": 1400, "PAK": 1100, "NPL": 650, "SGP": 50000, "SAU": 21000,
       "ARE": 38000, "ISR": 32000, "JOR": 4000, "FRA": 41000, "DEU": 42000, "GBR": 39000, "ITA": 35000,
       "ESP": 30000, "USA": 50000, "CAN": 47000, "MEX": 9000, "BRA": 11000, "ARG": 10000, "EGY": 2900,
       "NGA": 2300, "AUS": 52000, "NZL": 34000, "FJI": 3700, "PNG": 1900}
erows, eid, e15, e19 = [], 1, [], []
for code, base in gdp.items():
    for year in (2010, 2015):
        g = round(base * (1 if year == 2010 else random.uniform(0.9, 1.25)), 2)
        inc = ("High income" if g > 12000 else "Upper middle income" if g > 4000
               else "Lower middle income" if g > 1000 else "Low income")
        erows.append((eid, code, year, inc, g, round(random.uniform(5, 45), 2),
                      round(random.uniform(-1, 12), 2), round(random.uniform(15, 40), 2),
                      round(random.uniform(2, 15), 2)))
        eid += 1
    if code in ("JPN", "IND", "USA", "FRA", "DEU", "BRA", "AUS", "MEX"):
        inc = "High income" if base > 12000 else "Middle income"
        s15 = round(random.uniform(10, 35), 2)
        e15.append((code, 2015, inc, s15))
        e19.append((code, 2019, inc, round(s15 + random.uniform(-3, 3), 2)))
e19.append(("SGP", 2019, "High income", 47.5))
table("economies", "econ_id INTEGER PRIMARY KEY, code TEXT, year INTEGER, income_group TEXT, "
      "gdp_percapita REAL, gross_savings REAL, inflation_rate REAL, total_investment REAL, "
      "unemployment_rate REAL", erows)
table("economies2015", "code TEXT, year INTEGER, income_group TEXT, gross_savings REAL", e15)
table("economies2019", "code TEXT, year INTEGER, income_group TEXT, gross_savings REAL", e19)

curr = [("JPN", "Japanese yen", "JPY"), ("CHN", "Renminbi", "CNY"), ("IND", "Indian rupee", "INR"),
        ("PAK", "Pakistani rupee", "PKR"), ("NPL", "Nepalese rupee", "NPR"), ("SGP", "Singapore dollar", "SGD"),
        ("SAU", "Saudi riyal", "SAR"), ("ARE", "UAE dirham", "AED"), ("ISR", "Israeli new shekel", "ILS"),
        ("JOR", "Jordanian dinar", "JOD"), ("FRA", "Euro", "EUR"), ("DEU", "Euro", "EUR"),
        ("GBR", "Pound sterling", "GBP"), ("ITA", "Euro", "EUR"), ("ESP", "Euro", "EUR"),
        ("USA", "United States dollar", "USD"), ("CAN", "Canadian dollar", "CAD"), ("MEX", "Mexican peso", "MXN"),
        ("BRA", "Brazilian real", "BRL"), ("ARG", "Argentine peso", "ARS"), ("EGY", "Egyptian pound", "EGP"),
        ("NGA", "Nigerian naira", "NGN"), ("AUS", "Australian dollar", "AUD"), ("NZL", "New Zealand dollar", "NZD"),
        ("FJI", "Fijian dollar", "FJD"), ("PNG", "Papua New Guinean kina", "PGK"),
        ("BMU", "Bermudian dollar", "BMD")]
table("currencies", "curr_id INTEGER PRIMARY KEY, code TEXT, basic_unit TEXT, curr_code TEXT",
      [(i, *c) for i, c in enumerate(curr, 1)])

life = {"JPN": 83, "SGP": 82, "AUS": 82, "ITA": 82, "ESP": 82, "ISR": 82, "FRA": 82, "CAN": 81, "NZL": 81,
        "DEU": 81, "GBR": 81, "USA": 79, "CHN": 75, "MEX": 76, "ARG": 76, "BRA": 74, "SAU": 74, "ARE": 77,
        "JOR": 74, "EGY": 71, "IND": 68, "NPL": 69, "PAK": 66, "FJI": 70, "PNG": 62, "NGA": 53}
size = {"JPN": 127, "CHN": 1371, "IND": 1311, "PAK": 189, "NPL": 28, "SGP": 5.5, "SAU": 31, "ARE": 9.2,
        "ISR": 8.4, "JOR": 9.2, "FRA": 66, "DEU": 81, "GBR": 65, "ITA": 60, "ESP": 46, "USA": 321, "CAN": 36,
        "MEX": 127, "BRA": 206, "ARG": 43, "EGY": 92, "NGA": 182, "AUS": 24, "NZL": 4.6, "FJI": 0.9, "PNG": 7.6}
prows, pid = [], 1
for code in life:
    for year in (2010, 2015):
        le = round(life[code] - (1.2 if year == 2010 else 0) + random.uniform(-0.3, 0.3), 2)
        sz = round(size[code] * 1e6 * (0.95 if year == 2010 else 1))
        prows.append((pid, code, year, round(random.uniform(1.2, 5.5), 2), le, sz))
        pid += 1
table("populations", "pop_id INTEGER PRIMARY KEY, country_code TEXT, year INTEGER, fertility_rate REAL, "
      "life_expectancy REAL, size REAL", prows)

# ---------------------------------------------------------------- european soccer
soccer_countries = [(1, "England"), (2, "France"), (3, "Germany"), (4, "Italy"),
                    (5, "Netherlands"), (6, "Portugal"), (7, "Spain")]
table("country", "id INTEGER PRIMARY KEY, name TEXT", soccer_countries)
leagues = [(1, 1, "England Premier League"), (2, 2, "France Ligue 1"), (3, 3, "Germany 1. Bundesliga"),
           (4, 4, "Italy Serie A"), (5, 5, "Netherlands Eredivisie"), (6, 6, "Portugal Liga ZON Sagres"),
           (7, 7, "Spain LIGA BBVA")]
table("league", "id INTEGER PRIMARY KEY, country_id INTEGER, name TEXT", leagues)

teams = {
    1: [(8456, "Manchester City", "MCI"), (10260, "Manchester United", "MUN"), (8650, "Liverpool", "LIV"),
        (8455, "Chelsea", "CHE"), (9825, "Arsenal", "ARS")],
    2: [(9847, "Paris Saint-Germain", "PSG"), (8592, "Olympique de Marseille", "MAR"), (9748, "Olympique Lyonnais", "LYO")],
    3: [(9823, "FC Bayern Munich", "BMU"), (10189, "FC Schalke 04", "S04"), (9789, "Borussia Dortmund", "DOR"),
        (8178, "Bayer 04 Leverkusen", "LEV")],
    4: [(9857, "Bologna", "BOL"), (8636, "Inter", "INT"), (9885, "Juventus", "JUV"), (8686, "Roma", "ROM")],
    5: [(8593, "Ajax", "AJA"), (8640, "PSV", "PSV"), (10219, "SC Cambuur", "CAM")],
    6: [(9773, "FC Porto", "POR"), (9768, "SL Benfica", "BEN"), (6547, "FC Penafiel", "PEN")],
    7: [(8634, "FC Barcelona", "BAR"), (8633, "Real Madrid CF", "REA"), (8560, "Valencia CF", "VAL"),
        (9906, "Atlético Madrid", "AMA")],
}
never_home = {10219, 6547}  # promoted sides that only appear as away teams in this sample
trows, tid = [], 1
for cid, ts in teams.items():
    for api, longn, short in ts:
        trows.append((tid, api, longn, short, cid))
        tid += 1
table("team", "id INTEGER PRIMARY KEY, team_api_id INTEGER, team_long_name TEXT, team_short_name TEXT, "
      "country_id INTEGER", trows)


def goals():
    return random.choices(range(7), weights=[22, 30, 24, 13, 6, 3, 2])[0]


mrows, mid = [], 1
seasons = ["2011/2012", "2012/2013", "2013/2014", "2014/2015"]
for season in seasons:
    y = int(season[:4])
    for cid, ts in teams.items():
        ids = [t[0] for t in ts]
        pairs = [(h, a) for h in ids for a in ids if h != a and h not in never_home]
        random.shuffle(pairs)
        for n, (h, a) in enumerate(pairs[:8]):
            month = [8, 8, 9, 10, 12, 2, 3, 5][n]
            yy = y if month >= 8 else y + 1
            date = f"{yy}-{month:02d}-{random.randint(1, 28):02d}"
            stage = n * 4 + random.randint(1, 4)
            mrows.append([mid, cid, season, stage, date, h, a, goals(), goals()])
            mid += 1
# a few memorable matches so the lesson queries return something interesting
special = [
    (7, "2013/2014", 2, "2013-08-18", 8634, 8633, 6, 4),   # El Clasico goal-fest at home
    (7, "2012/2013", 20, "2013-01-26", 8634, 8633, 2, 2),
    (7, "2014/2015", 9, "2014-10-25", 8633, 8634, 3, 1),
    (7, "2013/2014", 30, "2014-03-23", 8633, 8634, 3, 4),
    (7, "2012/2013", 11, "2012-11-03", 8633, 8560, 9, 1),  # 8+ home goals
    (1, "2013/2014", 3, "2013-08-31", 8456, 9825, 8, 2),
    (4, "2013/2014", 6, "2013-09-29", 8636, 9857, 1, 2),   # Bologna away win
    (4, "2014/2015", 14, "2014-12-07", 9857, 8686, 3, 0),  # Bologna home win
    (3, "2014/2015", 2, "2014-08-23", 9823, 10189, 5, 5),
    (5, "2013/2014", 4, "2013-08-24", 8593, 10219, 7, 3),
    (6, "2012/2013", 16, "2013-01-05", 9773, 6547, 2, 1),
]
for cid, season, stage, date, h, a, hg, ag in special:
    mrows.append([mid, cid, season, stage, date, h, a, hg, ag])
    mid += 1
table("match", "id INTEGER PRIMARY KEY, country_id INTEGER, season TEXT, stage INTEGER, date TEXT, "
      "hometeam_id INTEGER, awayteam_id INTEGER, home_goal INTEGER, away_goal INTEGER", mrows)
sql.append("CREATE VIEW matches_germany AS SELECT * FROM match WHERE country_id = 3;")
sql.append("CREATE VIEW matches_italy AS SELECT * FROM match WHERE country_id = 4;")
sql.append("CREATE VIEW matches_spain AS SELECT * FROM match WHERE country_id = 7;")
sql.append("CREATE VIEW teams_spain AS SELECT * FROM team WHERE country_id = 7;")
sql.append("CREATE VIEW matches_2013_2014 AS SELECT * FROM match WHERE season = '2013/2014';")

table("product", "ProductID INTEGER PRIMARY KEY, Name TEXT, ListPrice REAL",
      [(1, "Water Bottle", 4.99), (2, "Bike Lock", 24.5), (3, "Sport Socks", 8.99),
       (4, "Cycling Cap", 8.99), (5, "Patch Kit", 2.29), (6, "Helmet", 34.99)])

departments = [(1, "Sales"), (2, "IT"), (3, "Finance"), (4, "Marketing")]
table("departments", "department_id INTEGER PRIMARY KEY, department_name TEXT", departments)
emps = [("Ava Thompson", 1, 72000), ("Liam Chen", 1, 58000), ("Noah Patel", 1, 64000),
        ("Mia Rossi", 2, 98000), ("Ethan Brown", 2, 105000), ("Zoe Kim", 2, 87000),
        ("Lucas Garcia", 3, 91000), ("Isla Novak", 3, 76000), ("Leo Martin", 4, 61000),
        ("Ruby Singh", 4, 69000), ("Omar Haddad", 2, 105000), ("Grace Lee", 3, 82000)]
table("employees", "employee_id INTEGER PRIMARY KEY, employee_name TEXT, department_id INTEGER, salary INTEGER",
      [(i, *e) for i, e in enumerate(emps, 1)])

# ---------------------------------------------------------------- soccer season (window functions)
table("matches", "match_id INTEGER PRIMARY KEY, match_date TEXT, team TEXT, opponent TEXT, "
      "goals_scored INTEGER, goals_conceded INTEGER, season TEXT", [
          (1, "2023-08-15", "Arsenal", "Liverpool", 3, 1, "2023/24"),
          (2, "2023-08-22", "Arsenal", "Chelsea", 2, 2, "2023/24"),
          (3, "2023-08-29", "Arsenal", "Man City", 1, 3, "2023/24"),
          (4, "2023-09-05", "Arsenal", "Spurs", 4, 0, "2023/24"),
          (5, "2023-08-16", "Liverpool", "Chelsea", 2, 1, "2023/24"),
          (6, "2023-08-23", "Liverpool", "Man City", 1, 1, "2023/24"),
          (7, "2023-08-17", "Chelsea", "Spurs", 3, 2, "2023/24"),
          (8, "2024-08-20", "Arsenal", "Liverpool", 2, 0, "2024/25"),
          (9, "2024-08-27", "Arsenal", "Chelsea", 3, 1, "2024/25"),
          (10, "2024-08-21", "Liverpool", "Man City", 1, 2, "2024/25")])
table("teams", "team_id INTEGER PRIMARY KEY, team_name TEXT, city TEXT, stadium TEXT", [
    (1, "Arsenal", "London", "Emirates"), (2, "Liverpool", "Liverpool", "Anfield"),
    (3, "Chelsea", "London", "Stamford Bridge"), (4, "Man City", "Manchester", "Etihad"),
    (5, "Spurs", "London", "Tottenham")])
table("seasons", "season_id INTEGER PRIMARY KEY, season_name TEXT, start_date TEXT, end_date TEXT", [
    (1, "2023/24", "2023-08-01", "2024-05-31"), (2, "2024/25", "2024-08-01", "2025-05-31")])

# ---------------------------------------------------------------- retail store
stores = [(101, "City Central", "Sydney"), (102, "Harbourside", "Sydney"), (103, "Riverside", "Melbourne"),
          (104, "Northgate", "Brisbane"), (105, "Lakeside", "Perth")]
table("stores", "store_id INTEGER PRIMARY KEY, store_name TEXT, city TEXT", stores)
products = [(5001, "Milk 2L", "Dairy", 4.50), (5002, "Bread White", "Bakery", 3.20),
            (5003, "Apples 1kg", "Produce", 5.99), (5004, "Cheese Cheddar 500g", "Dairy", 6.00),
            (5005, "Croissants 6pk", "Bakery", 4.99), (5006, "Bananas 1kg", "Produce", 3.50),
            (5007, "Chicken Breast 1kg", "Meat", 11.00), (5008, "Beef Mince 500g", "Meat", 8.50),
            (5009, "Pasta 500g", "Pantry", 2.20), (5010, "Rice 2kg", "Pantry", 4.80),
            (5011, "Hand Sanitizer", "Health", 3.99), (5012, "Toilet Paper 12pk", "Household", 9.50),
            (5013, "Yoghurt 1kg", "Dairy", 5.20), (5014, "Sourdough Loaf", "Bakery", 6.50),
            (5015, "Dish Soap", "Household", 3.30)]
table("products", "product_id INTEGER PRIMARY KEY, product_name TEXT, category TEXT, price REAL, "
      "supplier_id INTEGER, product_code TEXT",
      [(p[0], p[1], p[2], p[3], 100 + i % 6, str(p[0])) for i, p in enumerate(products)])
first = ["Alex", "Sam", "Jordan", "Taylor", "Casey", "Riley", "Morgan", "Jamie", "Avery", "Quinn",
         "Harper", "Rowan", "Skyler", "Charlie", "Emerson", "Finley", "Hayden", "Kai", "Logan", "Parker"]
last = ["Nguyen", "Smith", "Wilson", "Brown", "Taylor", "Khan", "Lee", "Martin", "Clarke", "Walker"]
custs = [(7001 + i, f"{first[i]} {last[i % len(last)]}", f"{first[i].lower()}{i + 1}@example.com")
         for i in range(20)]
table("customers", "customer_id INTEGER PRIMARY KEY, customer_name TEXT, email TEXT", custs)
srows = [(1, "2024-01-15", 101, 5001, 2, 9.00, 7001), (2, "2024-01-15", 102, 5002, 1, 3.20, 7002),
         (3, "2024-01-16", 101, 5003, 3, 17.97, 7003)]
for sid in range(4, 401):
    day = random.randint(1, 91)
    month = 1 if day <= 31 else 2 if day <= 60 else 3
    dom = day if month == 1 else day - 31 if month == 2 else day - 60
    p = random.choice(products)
    qty = random.choices([1, 2, 3, 4, 6], weights=[45, 30, 12, 8, 5])[0]
    cust = None if random.random() < 0.04 else random.choice(custs)[0]
    if day == 15 and month == 1 and random.random() < 0.5:
        st = 101
    else:
        st = random.choice(stores)[0]
    srows.append((sid, f"2024-{month:02d}-{dom:02d}", st, p[0], qty, round(qty * p[3], 2), cust))
table("sales", "sale_id INTEGER PRIMARY KEY, transaction_date TEXT, store_id INTEGER, product_id INTEGER, "
      "quantity INTEGER, amount REAL, customer_id INTEGER", srows)
table("inventory", "product_id INTEGER PRIMARY KEY, current_stock INTEGER",
      [(p[0], random.randint(40, 600)) for p in products])
table("products_history", "product_key INTEGER PRIMARY KEY, product_id INTEGER, price REAL, valid_from TEXT, "
      "valid_to TEXT, is_current INTEGER",
      [(1, 5001, 4.50, "2023-01-01", "2024-01-31", 0), (2, 5001, 4.80, "2024-02-01", "9999-12-31", 1),
       (3, 5002, 3.20, "2023-01-01", "9999-12-31", 1), (4, 5003, 5.49, "2023-01-01", "2024-02-14", 0),
       (5, 5003, 5.99, "2024-02-15", "9999-12-31", 1)] +
      [(i + 6, p[0], p[3], "2023-01-01", "9999-12-31", 1) for i, p in enumerate(products[3:])])

text = "-- Practice database for the SQL tutorials (generated by tools/build_db.py)\n" + "\n".join(sql) + "\n"
OUT.write_text(text)
con = sqlite3.connect(":memory:")
con.executescript(text)
n = con.execute("SELECT count(*) FROM sqlite_master WHERE type IN ('table','view')").fetchone()[0]
print(f"wrote {OUT} ({len(text) // 1024} KB, {n} tables/views)")
