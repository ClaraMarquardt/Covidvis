# ----------------------------------------------------------------------- #

# CovidVis

# File:         dataprocessing.py
# Maintainer:   Clara
# Last Updated: 2020-05-18
# Language:     Python 3.7

# ------------------------------------------------------------------------ #

# ------------------------------------------------------------------------ #
# Initialization
# ------------------------------------------------------------------------ #

# Load dependencies
# ---------------------------------------------#
import pandas as pd
import numpy as np

# ------------------------------------------------------------------------ #
# Define Functions
# ------------------------------------------------------------------------ #

# process_county_data_crosswalk
# ---------------------------------------------#
def process_county_data_crosswalk(county_data):

	# Subset default 
	county_data_crosswalk = county_data[['state', 'county', 'county_id']]

	# Unique
	county_data_crosswalk = county_data_crosswalk.drop_duplicates()

	# Return the results
	return(county_data_crosswalk)


# process_county_data
# ---------------------------------------------#
def process_county_data(county_data, state):

	# Subset default 
	county_data_subset = county_data[county_data['scenario']=="Full social mobility"]
	county_data_subset = county_data_subset[['state', 'county', 'county_id', 'date', 'stay_home_ratio',
     'cummulative_predicted', 'cummulative_deaths',  'r_t']]

	# Subset custom
	county_data_subset = county_data_subset[county_data['state']==state]

	# Generate aggregate 
	county_data_subset['temp_index'] = np.array(county_data_subset[['county']].groupby("county").cumcount())
	county_data_subset_agg  = county_data_subset[['temp_index','date', 'cummulative_predicted','cummulative_deaths']].groupby(["temp_index","date"]).sum().reset_index()
	county_data_subset_agg  = county_data_subset_agg.drop(["temp_index"], axis=1)
	county_data_subset_avg  = county_data_subset[['temp_index','date','stay_home_ratio','r_t']].groupby(["temp_index","date"]).mean().reset_index()
	county_data_subset_avg  = county_data_subset_avg.drop(["temp_index"], axis=1)
	county_data_subset_comb = pd.merge(county_data_subset_avg, county_data_subset_agg, on="date")
	county_data_subset_comb['state']     = state
	county_data_subset_comb['county']    = 'Aggregate'
	county_data_subset_comb['county_id'] = 0
	
	# Combine dataframes
	county_data_subset = county_data_subset.drop(["temp_index"], axis=1)
	county_data_subset = pd.concat([county_data_subset, county_data_subset_comb])
	
	# Return the results
	return(county_data_subset)

# process_map_data
# ---------------------------------------------#
def process_map_data(map_data, state):

	# Return the results
	return(map_data)


# ------------------------------------------------------------------------ #
# ------------------------------------------------------------------------ #

