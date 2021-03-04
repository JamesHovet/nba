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

all_seasons_list = [pd.read_csv("./data_source/" + fileName) for fileName in files]

compiled = pd.concat(all_seasons_list)


# SHOT_TYPE TO FLAG
compiled.replace('3PT Field Goal', '3', inplace=True)
compiled.replace('2PT Field Goal', '2', inplace=True)

# ACTION_TYPE TO NUMBER
shot_types = list(compiled['ACTION_TYPE'].unique())

shot_mappings = {i:v for i, v in enumerate(shot_types)}
shot_mappings_rev = {
    "Layup Shot": 0,
    "Pullup Jump shot": 1,
    "Step Back Jump shot": 2,
    "Driving Layup Shot": 3,
    "Jump Shot": 4,
    "Reverse Layup Shot": 5,
    "Alley Oop Dunk Shot": 6,
    "Slam Dunk Shot": -1,
    "Driving Dunk Shot": 8,
    "Turnaround Jump Shot": 9,
    "Running Jump Shot": 10,
    "Turnaround Fadeaway shot": 11,
    "Hook Shot": 12,
    "Putback Dunk Shot": -1,
    "Dunk Shot": 14,
    "Alley Oop Layup shot": -1,
    "Fadeaway Jump Shot": 16,
    "Floating Jump shot": 17,
    "Jump Hook Shot": -1,
    "Tip Shot": 19,
    "Running Bank shot": -1,
    "Putback Layup Shot": 21,
    "Turnaround Hook Shot": 22,
    "Driving Reverse Layup Shot": 23,
    "Jump Bank Shot": 24,
    "Running Layup Shot": 25,
    "Finger Roll Layup Shot": -1,
    "Reverse Slam Dunk Shot": -1,
    "Driving Finger Roll Layup Shot": 28,
    "Running Hook Shot": -1,
    "Driving Jump shot": -1,
    "Driving Hook Shot": -1,
    "Running Dunk Shot": -1,
    "Running Slam Dunk Shot": -1,
    "Running Reverse Layup Shot": -1,
    "Fadeaway Bank shot": -1,
    "Running Tip Shot": -1,
    "Putback Slam Dunk Shot": -1,
    "Pullup Bank shot": -1,
    "Driving Slam Dunk Shot": -1,
    "Driving Bank shot": -1,
    "Turnaround Bank shot": -1,
    "Running Bank Hook Shot": -1,
    "Running Finger Roll Layup Shot": -1,
    "Jump Bank Hook Shot": -1,
    "Hook Bank Shot": -1,
    "Turnaround Bank Hook Shot": -1,
    "Reverse Dunk Shot": -1,
    "Driving Bank Hook Shot": -1,
    "Putback Reverse Dunk Shot": -1,
    "Driving Floating Jump Shot": 50,
    "Turnaround Fadeaway Bank Jump Shot": -1,
    "Running Pull-Up Jump Shot": -1,
    "Cutting Layup Shot": 53,
    "Tip Layup Shot": 54,
    "Tip Dunk Shot": -1,
    "Cutting Dunk Shot": 56,
    "Driving Floating Bank Jump Shot": -1,
    "Cutting Finger Roll Layup Shot": -1,
    "Running Alley Oop Layup Shot": -1,
    "Step Back Bank Jump Shot": -1,
    "Running Alley Oop Dunk Shot": -1,
    "Running Reverse Dunk Shot": -1,
    "Driving Reverse Dunk Shot": -1,
    "No Shot": -1
}

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




