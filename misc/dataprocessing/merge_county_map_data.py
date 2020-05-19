# Merge fips_codes (external) & county_data (model data)
# Source: https://www.nrcs.usda.gov/wps/portal/nrcs/detail/ma/home/?cid=nrcs143_013697

# Import dependencies
import pandas as pd
import re

# Load the data
dtype_dic= {'FIPS': str}

fips_codes   = pd.read_csv("data/non_active/map/fips_codes.csv", encoding="utf-8", dtype = dtype_dic)
county_data  = pd.read_csv("data/non_active/county_data.csv", encoding="utf-8")

# Format the datasets

## Format county data
county_data           = county_data.drop(['state.1'], axis=1)
county_data['county'] = [re.sub(r"\.","",x) for x in county_data['county']]
county_data['county'] = [re.sub(r"DeKalb","De Kalb",x) for x in county_data['county']]

## Format fips codes
fips_codes['county']     = fips_codes['Name']
fips_codes['state']      = fips_codes['State']
fips_codes['county_id']  = fips_codes['FIPS']
fips_codes               = fips_codes[['county_id','county','state']]
fips_codes               = fips_codes[~pd.isna(fips_codes['county'])]

# Merge the datasets
county_data_augmented              = pd.merge(county_data, fips_codes, on=['county','state'], how="left")
county_data_augmented[pd.isna(county_data_augmented['county_id'])]


# Save the new data file
county_data_augmented.to_csv("data/county_data_augmented.csv", index=False)