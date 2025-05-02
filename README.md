# Opuntia stricta Mapping in Laikipia, Kenya 🌵

> **Paper title**: *Uncovering the Spread of* ***Opuntia stricta* (Haw.) Haw.* *in Kenya’s Drylands with Sentinel‑2 Time Series and Explainable Machine Learning*

## Overview
This repository hosts the data and code for mapping **Opuntia stricta** at 10 m spatial resolution across Laikipia County, Kenya, and interpreting drivers of its distribution using SHAP‑based Random Forest.

<p align="center">
  <img src="results/overview_map.png" width="70%" alt="Study area and prediction map"/>
</p>

### Key features
1. **Time‑series Sentinel‑2** (2019‑2023) + **WorldClim** climate + terrain & anthropogenic layers  
2. **Recursive feature elimination** + **grid‑based spatial CV** to mitigate spatial autocorrelation  
3. **Explainable ML** with SHAP; dry‑season precipitation & population density emerged most influential  
4. **Hotspot & kernel density** analyses for management‐ready invasion risk products  
5. End‑to‑end **open & modular code**: Notebook demos + script batch mode + pytest

## Quick start

```bash
# clone
git clone https://github.com/Ecosystem-Services-GeoAI/Opuntia-Stricta-Mapping-Laikipia-Kenya.git
cd opuntia-stricta-mapping-laikipia

# create conda env
conda env create -f environment.yml
conda activate opuntia

# run a pipeline demo
jupyter notebook notebooks/main.ipynb
