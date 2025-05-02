var canopyHeight = ee.ImageCollection('projects/meta-forest-monitoring-okw37/assets/CanopyHeight').mosaic();

var canopyHeightCropped = canopyHeight.clip(roi);

var canopyHeightReprojected = canopyHeightCropped.reproject({
  crs: 'EPSG:4326',
  scale:10 
});


Export.image.toDrive({
  image: canopyHeightReprojected,
  description: 'CanopyHeight_ROI',
  folder: 'Cactus1', 
  fileNamePrefix: 'CanopyHeight_ROI',
  region: roi,
  scale: 10, 
  crs: 'EPSG:4326',
  maxPixels: 1e13
});