# heatmap-hook
Automatic heat map generation from running data

## Project Goals

1. Given map of San Francisco and a user's Strava data, generate an image containing all running routes
2. Automatically update routes as they are added
3. Change image into a dynamic map layer that can be integrated with leaflet for use on the web
4. Expand functionality to support multiple cities/region, and eventually arbitrary shapes


## Overview

1. On first use, application establishes connection to Strava API, collects bundle of all user data in the form of TCX files
2. Geospatially filter all TCX files against selected region
   - Store region-filtered workouts for a user in a DB instance along with the most recently fetched timestamp
    - Future loads will only fetch workouts from after this timestamp to continue DB population
3. Read data and convert TCX file contents into a PNG using matplotlib
4. Define bounding box, create GeoTIFF using GDAL
5. Serve raster back to user
