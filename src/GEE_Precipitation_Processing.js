var monthParams = [
  {
    startDate: '2019-08-01',
    endDate: '2019-08-31',
    cloudCoverThreshold: 20,
    outputDescription: '2019_08_precipitation'
  },
  {
    startDate: '2019-06-01',
    endDate: '2019-06-30',
    cloudCoverThreshold: 20,
    outputDescription: '2019_06_precipitation'
  },
  {
    startDate: '2019-05-01',
    endDate: '2019-05-31',
    cloudCoverThreshold: 20,
    outputDescription: '2019_05_precipitation'
  },
  {
    startDate: '2019-04-01',
    endDate: '2019-04-30',
    cloudCoverThreshold: 30,
    outputDescription: '2019_04_precipitation'
  },
  {
    startDate: '2019-03-01',
    endDate: '2019-03-31',
    cloudCoverThreshold: 20,
    outputDescription: '2019_03_precipitation'
  },
  {
    startDate: '2019-02-01',
    endDate: '2019-02-28',
    cloudCoverThreshold: 20,
    outputDescription: '2019_02_precipitation'
  },
  {
    startDate: '2019-01-01',
    endDate: '2019-01-31',
    cloudCoverThreshold: 20,
    outputDescription: '2019_01_precipitation'
  },
  {
    startDate: '2019-12-01',
    endDate: '2019-12-31',
    cloudCoverThreshold: 30,
    outputDescription: '2019_12_precipitation'
  },
  {
    startDate: '2019-10-01',
    endDate: '2019-10-31',
    cloudCoverThreshold: 20,
    outputDescription: '2019_10_precipitation'
  },
  {
    startDate: '2019-09-01',
    endDate: '2019-09-30',
    cloudCoverThreshold: 20,
    outputDescription: '2019_09_precipitation'
  },
  {
    startDate: '2019-07-01',
    endDate: '2019-07-31',
    cloudCoverThreshold: 20,
    outputDescription: '2019_07_precipitation'
  },
  {
    startDate: '2019-11-01',
    endDate: '2019-11-30',
    cloudCoverThreshold: 20,
    outputDescription: '2019_11_precipitation'
  }
];

// Define a function to process, export, and visualize CHIRPS precipitation data
function processMODISLST(startDate, endDate, outputDescription) {
  var dataset = ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD')
                  .filter(ee.Filter.date(startDate, endDate))
                  .filterBounds(roi);

  var precipitation = dataset.select('precipitation')
                              .map(function(image) { 
                                  // Resample the image to 10m resolution and reproject to EPSG:4326
                                  var resampledImage = image.resample('bilinear').reproject({
                                    crs: 'EPSG:4326',
                                    scale: 10 // Target scale for resampling
                                  });
                                  return resampledImage.clip(roi);
                              });

  var meanPrecipitation = precipitation.mean();

  // Export the processed image in EPSG:4326
  Export.image.toDrive({
    image: meanPrecipitation.reproject({crs: 'EPSG:4326', scale: 10}),
    description: outputDescription,
    folder: 'Cactus',
    fileNamePrefix: outputDescription,
    scale: 10, // Set the scale in meters
    region: roi,
    crs: 'EPSG:4326',
    fileFormat: 'GeoTIFF',
    maxPixels: 1e13
  });
}

// Iterate over the monthParams, process each month, and export
for (var i = 0; i < monthParams.length; i++) {
  var params = monthParams[i];
  processMODISLST(
    params.startDate,
    params.endDate,
    params.outputDescription
  );
}
