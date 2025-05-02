# 📂 `data/` — Training & Test Tables

This folder contains the **tabular reference data** used throughout the study *Uncovering the Spread of *Opuntia stricta* (Haw.) Haw. in Kenya’s Drylands with Sentinel‑2 Time Series and Explainable Machine Learning*. All imagery is stored elsewhere; here we provide only the point‐based samples and metadata necessary for model replication.

---

## 1. Files

| File                           | Purpose                                                                | CRS                |
| ------------------------------ | ---------------------------------------------------------------------  | ------------------ |
| `opuntia_train_val.csv`        | Combined **training + validation** samples (stratified spatial split)  | EPSG:4326 (WGS 84) |
| `opuntia_test_independent.csv` | **Independent test** set withheld from model tuning                    | EPSG:4326          |

Both tables share the same schema (see below).

---

## 2. Column Schema

| Column                         | Type                    | Description                                                                                                                                          |
| ------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `X`, `Y`                       | float                   | Longitude & latitude of 10 m × 10 m Sentinel‑2 pixel centroid (degrees, EPSG:4326)                                                                   |
| `Class`                        | int (1 / 2 / 5 / 7 / 9) | Land‑cover class label (see mapping below)                                                                                                           |
| `Canopy`                       | int (1 / 2 / 3)         | *Opuntia stricta* canopy purity (details below)                                                                                                      |
| `Percent`                      | float                   | Estimated percentage cover of *O. stricta* within the 10 m cell (%)                                                                                  |
| `Methods`                      | int (1 / 2 / 3)         | Sampling/annotation source (details below)                                                                                                           |
| `Fold`                         | int                     | Spatial CV fold ID (training set only)                                                                                                               |
| **120 × Sentinel‑2 bands**     | float                   | Monthly surface‑reflectance 10 bands (Jan–Dec 2023)                                                                                                |
| **48 Vegetation Indices**      | float                   | NDVI, NDWI, GNDVI, MSAVI2 (12 months × 4 indices)                                                                                                    |
| **48 Climatic layers**         | float                   | Precipitation, MODIS LST (Night/Day) & MOD16 ET (Jan–Dec)                                                                                     |
| **13 Terrain & anthropogenic** | float                   | Slope, Aspect, Elevation, TWI, TPI, Distance to rivers, wetlands, water bodies & protected area; KDE of population, livestock, buildings; Canopy height |

---

## 3. Class Mapping

| `Class` code | Land‑cover category |
| ------------ | ------------------- |
| 1            | Tree                |
| 2            | Grassland           |
| 5            | Shrubland           |
| 7            | Bare land           |
| 9            | *Opuntia stricta*   |

---

## 4. Auxiliary Fields

### 4.1 `Canopy`

*Quantifies the purity of *O. stricta* canopy within the pixel (Opuntia samples only).*
`1 = predominantly *O. stricta* `
`2 = mixed canopy, *O. stricta* dominant`
`3 = mixed canopy, other vegetation dominant`

> **Model training used only `Canopy = 1` Opuntia pixels** to ensure spectral consistency.

### 4.2 `Percent`

Field or photo‑interpreted estimate of *O. stricta* fractional cover in the 10 m cell, obtained by digitising projected canopy area.

### 4.3 `Methods`

| Code | Data source                                                 |
| ---- | ----------------------------------------------------------- |
| 1    | Google Maps imagery annotations                             |
| 2    | Combined Google Street View panoramas + Google Maps imagery |
| 3    | Field vegetation surveys                                    |

---

## 5. Feature Extraction Workflow

All  **predictor layers** (see column groups above) were mosaicked into a single multi‑band GeoTIFF. Point values were then extracted via **Rasterio `sample()`**:


The resulting NumPy array was concatenated to the attribute table and exported as these CSVs.

---


*Last updated: 2025‑05‑02*
