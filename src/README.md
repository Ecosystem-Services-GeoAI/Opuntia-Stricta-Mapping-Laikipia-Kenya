# src/

Python and JavaScript (Google Earth Engine) utilities for downloading, preprocessing, and feature‑engineering the environmental layers used in the study.

| File | Type | Purpose |
|------|------|---------|
| **`GEE_Canopy_Height_Processing.js`** | GEE JS | Exports canopy‑height metrics. |
| **`GEE_DEM_Processing.js`** | GEE JS | Export  DEM. |
| **`GEE_ET_LST_Processing.js`** | GEE JS | Builds evapotranspiration (MOD16A2) and day/nighttime LST composites map. |
| **`GEE_Canopy_Precipitation_Processing.js`** | GEE JS | Generates precipitation map. |
| **`GEE_Sentinel_2_Images_Processing.js`** | GEE JS | Creates quarterly cloud‑masked monthly Sentinel‑2 L2A mosaics. |
| **`VI_Processing.ipynb`** | Python | Computes vegetation indices (NDVI, EVI, MSAVI2, etc.) from the exported Sentinel‑2 image stacks. |
 **`GeoTIFF_Generating.ipynb`** | Python |Builds the *derived‑feature GeoTIFF stack*: loads the pre‑downloaded environmental layers, computes time‑series Dynamic Time Warping (DTW) distances and other statistical features, and writes the complete GeoTIFF used by the modelling pipeline. |
