import pandas as pd
import json

files = ["2010-11_Regular_ShotDetail.csv",
"2011-12_Regular_ShotDetail.csv",
"2012-13_Regular_ShotDetail.csv",
"2013-14_Regular_ShotDetail.csv",
"2014-15_Regular_ShotDetail.csv",
"2015-16_Regular_ShotDetail.csv",
"2016-17_Regular_ShotDetail.csv",
"2017-18_Regular_ShotDetail.csv",
"2018-19_Regular_ShotDetail.csv",
"2019-20_Regular_ShotDetail.csv"]

all_seasons_list = [pd.read_csv("./" + fileName) for fileName in files]

compiled = pd.concat(all_seasons_list)


# SHOT_TYPE TO FLAG
compiled.replace('3PT Field Goal', '3', inplace=True)
compiled.replace('2PT Field Goal', '2', inplace=True)

# ACTION_TYPE TO NUMBER
shot_types = list(compiled['ACTION_TYPE'].unique())

shot_mappings = {i:v for i, v in enumerate(shot_types)}
shot_mappings_rev = {v:i for i, v in enumerate(shot_types)}

print(json.dumps(shot_mappings))
print(json.dumps(shot_mappings_rev))

compiled.replace(shot_mappings_rev, inplace = True)

# season

def gameIDToSeason(id):
	id_str = str(id)
	return "20" + id_str[1:3]

compiled["SEASON"] = (compiled['GAME_ID']).transform(gameIDToSeason)

# team ID
compiled['TEAM_ID'] = compiled['TEAM_ID'] - 1610612700

# time remaining

compiled["TOTAL_REMAINING_IN_GAME"] =  (-(compiled['PERIOD'] - 4) * 60 * 12) + compiled['MINUTES_REMAINING'] * 60 + compiled['SECONDS_REMAINING']

removed_cols = ['GRID_TYPE', 'GAME_EVENT_ID', 'PLAYER_NAME', 'TEAM_NAME', 'EVENT_TYPE', 'SHOT_ZONE_BASIC', 'SHOT_ZONE_AREA', 'SHOT_ZONE_RANGE', 'SHOT_ATTEMPTED_FLAG', 'GAME_DATE', 'GAME_ID', 'MINUTES_REMAINING', 'SECONDS_REMAINING', 'HTM', 'VTM']

compiled.drop(columns=removed_cols, inplace=True)

compiled.to_csv("./compiled.csv", index=False)




