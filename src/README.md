# src/

Python and JavaScript (Google Earth Engine) utilities for downloading, preprocessing, and feature‑engineering the environmental layers used in the study.

| File | Type | Purpose |
|------|------|---------|
| **`GEE_Canopy_Height_Processing.js`** | GEE JS | Exports NASA GEDI canopy‑height metrics and resamples them to 10 m. |
| **`GEE_DEM_Processing.js`** | GEE JS | Clips SRTM/ALOS DEM, derives slope & aspect, reprojects to EPSG :4326 at 30 m. |
| **`GEE_ET_LST_Processing.js`** | GEE JS | Builds 8‑day evapotranspiration (MOD16A2) and monthly nighttime LST composites. |
| **`GEE_Canopy_Precipitation_Processing.js`** | GEE JS | Generates CHELSA dry‑season precipitation sum and canopy cover percentage. |
| **`GEE_Sentinel_2_Images_Processing.js`** | GEE JS | Creates quarterly cloud‑masked Sentinel‑2 L2A mosaics (2019 – 2023). |
| **`VI_Processing.ipynb`** | Python | Computes vegetation indices (NDVI, EVI, MSAVI2, Ferrous/Clay Ratios, etc.) from the exported Sentinel‑2 image stacks. |
 **`GeoTIFF_Generating.ipynb`** | Python |Builds the *derived‑feature GeoTIFF stack*: loads the pre‑downloaded environmental layers, computes time‑series Dynamic Time Warping (DTW) distances and other statistical features, and writes the complete multi‑band GeoTIFF used by the modelling pipeline. |