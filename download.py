import json
import pandas as pd
from nba_api.stats.endpoints import ShotChartDetail

seasons = ["2010-11",
"2011-12",
"2012-13",
"2013-14",
"2014-15",
"2015-16",
"2016-17",
"2017-18",
"2018-19",
"2019-20"]

one_season = ["2018-19"]

for season in seasons:
	response = ShotChartDetail(
		context_measure_simple="FGA",
		team_id=0,
		player_id=0,
		season_nullable=season,
		season_type_all_star='Regular Season'
	)

	content = json.loads(response.get_json())

	results = content['resultSets'][0]
	headers = results['headers']
	rows = results['rowSet']
	df = pd.DataFrame(rows)
	df.columns = headers

	# write to csv file
	df.to_csv("./" + season + "_Regular_ShotDetail.csv", index=False)
	print(df.head())
