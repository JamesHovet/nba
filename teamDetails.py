import json
import pandas as pd
import time
from nba_api.stats.endpoints import TeamDetails

teams = [
1610612755,
1610612738,
1610612744,
1610612760,
1610612749,
1610612766,
1610612751,
1610612765,
1610612754,
1610612763,
1610612748,
1610612753,
1610612737,
1610612752,
1610612761,
1610612739,
1610612740,
1610612745,
1610612759,
1610612750,
1610612758,
1610612762,
1610612746,
1610612743,
1610612742,
1610612756,
1610612741,
1610612764,
1610612747,
1610612757]

idToAbbrev = {}
abbrevToFull = {}

for team in teams:
	response = TeamDetails(
		team_id=team
	)

	content = json.loads(response.get_json())
	results = content['resultSets'][0]
	headers = results['headers']
	rows = results['rowSet']
	df = pd.DataFrame(rows)
	df.columns = headers

	print(df.head())

	print(df['ABBREVIATION'][0])

	idToAbbrev[team] = df['ABBREVIATION'][0] 
	abbrevToFull[df['ABBREVIATION'][0]] = df['CITY'][0] + " " + df['NICKNAME'][0]

	time.sleep(1)


print(idToAbbrev)
print()

print(abbrevToFull)
print()

print(json.dumps(abbrevToFull))
print()
"""
{55: 'PHI', 38: 'BOS', 44: 'GSW', 60: 'OKC', 49: 'MIL', 66: 'CHA', 51: 'BKN', 65: 'DET', 54: 'IND', 63: 'MEM', 48: 'MIA', 53: 'ORL', 37: 'ATL', 52: 'NYK', 61: 'TOR', 39: 'CLE', 40: 'NOP', 45: 'HOU', 59: 'SAS', 50: 'MIN', 58: 'SAC', 62: 'UTA', 46: 'LAC', 43: 'DEN', 42: 'DAL', 56: 'PHX', 41: 'CHI', 64: 'WAS', 47: 'LAL', 57: 'POR'}
"""
"""
{"PHI": "Philadelphia 76ers", "BOS": "Boston Celtics", "GSW": "Golden State Warriors", "OKC": "Oklahoma City Thunder", "MIL": "Milwaukee Bucks", "CHA": "Charlotte Hornets", "BKN": "Brooklyn Nets", "DET": "Detroit Pistons", "IND": "Indiana Pacers", "MEM": "Memphis Grizzlies", "MIA": "Miami Heat", "ORL": "Orlando Magic", "ATL": "Atlanta Hawks", "NYK": "New York Knicks", "TOR": "Toronto Raptors", "CLE": "Cleveland Cavaliers", "NOP": "New Orleans Pelicans", "HOU": "Houston Rockets", "SAS": "San Antonio Spurs", "MIN": "Minnesota Timberwolves", "SAC": "Sacramento Kings", "UTA": "Utah Jazz", "LAC": "Los Angeles Clippers", "DEN": "Denver Nuggets", "DAL": "Dallas Mavericks", "PHX": "Phoenix Suns", "CHI": "Chicago Bulls", "WAS": "Washington Wizards", "LAL": "Los Angeles Lakers", "POR": "Portland Trail Blazers"}
"""