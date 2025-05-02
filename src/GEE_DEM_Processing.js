var dataset = ee.Image('USGS/SRTMGL1_003');

// Define the new resolution (10m) and the projection
var newResolution = 10;
var newProjection = dataset.projection();

// Use the .reproject() function to resample the data
var srtm10 = dataset.reproject({
  crs: newProjection,
  scale: newResolution
});
var dataset = srtm10.clip(roi);
// Visualize the resampled data
// Custom color palette for elevation between 1500 and 2500
var customPalette = [
  '0512CC',  // Dark blue for values around 1500
  '0638E7',
  '0853FF',
  '0A6EFF',
  '0C8BFF',
  '0EA6FF',
  '10C2FF',
  '12D9FF',
  '14F0FF',
  '16FEFF',
  '64FFBE',  // Light green for values around 2000
  '9BFF96',
  'D2FF6D',
  'FEFF43',
  'FFEC00',  // Yellow for values around 2250
  'FFD800',
  'FFC300',
  'FFB000',
  'FF9900',
  'FF8700',
  'FF7500',
  'FF6200',
  'FF5000',
  'FF3D00',
  'FF2B00',
  'FF1900',
];

// Visualize the resampled data with the custom palette
Map.addLayer(dataset, {
  min: 1500,
  max: 2500,
  palette: customPalette
}, 'SRTM 10m Custom Palette (1500-2500)');
Export.image.toDrive({
  image: dataset,
  description: 'SRTM_ELEV',
  folder: 'SRTM',
  region: roi,
  scale: 10,
  maxPixels: 1e13
  //crs: 'EPSG:5070'
});