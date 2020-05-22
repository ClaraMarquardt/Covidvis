# ----------------------------------------------------------------------- #

# CovidVis

# File:         application.py
# Maintainer:   Clara
# Last Updated: 2020-05-18
# Language:     Python 3.7

# ------------------------------------------------------------------------ #

# ------------------------------------------------------------------------ #
# Initialization
# ------------------------------------------------------------------------ #

# Load external dependencies
# ---------------------------------------------#
import flask
import pandas as pd
# import geopandas


# Load internal dependencies
# ---------------------------------------------#
import sys
sys.path.append('backend')
import dataprocessing as dp

# Initialize the flask application
# ---------------------------------------------#
application = flask.Flask(__name__, 
	template_folder = 'frontend', 
	static_folder = 'frontend')

# ------------------------------------------------------------------------ #
# Load data
# ------------------------------------------------------------------------ #

# county_data
# ---------------------------------------------#
county_data     = pd.read_csv("data/county_data_augmented.csv", encoding="utf-8")
# map_data      = geopandas.read_file("data/map/us.json")

# ------------------------------------------------------------------------ #
# Define views
# ------------------------------------------------------------------------ #
	
# index
# ---------------------------------------------#
@application.route('/')
def index_view():

	# Subset data
	county_data_subset = dp.process_county_data(county_data=county_data, state=flask.request.args.get('state'))
	
	# Render home page
	return flask.render_template('index.html')

# load_county_data_crosswalk
# ---------------------------------------------#
@application.route('/load_county_data_crosswalk')
def load_county_data_crosswalk_view():

	# Subset data
	county_data_crosswalk_subset = dp.process_county_data_crosswalk(county_data=county_data)

	# Render home page
	return county_data_crosswalk_subset.to_csv()


# load_county_data
# ---------------------------------------------#
@application.route('/load_county_data')
def load_county_data_view():

	# Inspect the request
	print(flask.request.args.get('state'))

	# Subset data
	county_data_subset = dp.process_county_data(county_data=county_data, state=flask.request.args.get('state'))
	
	# Render home page
	return county_data_subset.to_csv()

# load_map_data
# ---------------------------------------------#
@application.route('/load_map_data')
def load_map_data_view():

	# Inspect the request
	print(flask.request.args.get('state'))

	# Subset data
	map_data_subset = dp.process_map_data(map_data=map_data, state=flask.request.args.get('state'))
	
	# Render home page
	return map_data_subset.to_json()

# ------------------------------------------------------------------------ #
# Launch application
# ------------------------------------------------------------------------ #
if __name__ == "__main__":
	application.run()

# ------------------------------------------------------------------------ #
# ------------------------------------------------------------------------ #
