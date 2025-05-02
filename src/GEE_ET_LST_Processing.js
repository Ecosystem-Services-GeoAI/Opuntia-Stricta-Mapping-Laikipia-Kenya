var monthParams = [
  {
    startDate: '2023-08-01',
    endDate: '2023-08-31',
    cloudCoverThreshold: 20,
    outputDescription: '2023_08_ET'
  },
  {
    startDate: '2023-06-01',
    endDate: '2023-06-30',
    cloudCoverThreshold: 20,
    outputDescription: '2023_06_ET'
  },
  {
    startDate: '2023-05-01',
    endDate: '2023-05-31',
    cloudCoverThreshold: 20,
    outputDescription: '2023_05_ET'
  },
  {
    startDate: '2023-04-01',
    endDate: '2023-04-30',
    cloudCoverThreshold: 30,
    outputDescription: '2023_04_ET'
  },
  {
    startDate: '2023-03-01',
    endDate: '2023-03-31',
    cloudCoverThreshold: 20,
    outputDescription: '2023_03_ET'
  },
  {
    startDate: '2023-02-01',
    endDate: '2023-02-28',
    cloudCoverThreshold: 20,
    outputDescription: '2023_02_ET'
  },
  {
    startDate: '2023-01-01',
    endDate: '2023-01-31',
    cloudCoverThreshold: 20,
    outputDescription: '2023_01_ET'
  },
  {
    startDate: '2023-12-01',
    endDate: '2023-12-31',
    cloudCoverThreshold: 30,
    outputDescription: '2023_12_ET'
  },
  {
    startDate: '2023-10-01',
    endDate: '2023-10-31',
    cloudCoverThreshold: 20,
    outputDescription: '2023_10_ET'
  },
  {
    startDate: '2023-09-01',
    endDate: '2023-09-30',
    cloudCoverThreshold: 20,
    outputDescription: '2023_09_ET'
  },
  {
    startDate: '2023-07-01',
    endDate: '2023-07-31',
    cloudCoverThreshold: 20,
    outputDescription: '2023_07_ET'
  },
  {
    startDate: '2023-11-01',
    endDate: '2023-11-30',
    cloudCoverThreshold: 20,
    outputDescription: '2023_11_ET'
  }
];

// Define a function to process, export, and visualize MODIS LST data
// MODIS/061/MOD16A2 ET
// MODIS/061/MOD11A1 LST_Day_1km LST_Night_1km
// MODIS/061/MOD16A2GF
function processMODISLST(startDate, endDate, outputDescription) {
  var dataset = ee.ImageCollection('MODIS/061/MOD16A2GF')
                  .filter(ee.Filter.date(startDate, endDate))
                  .filterBounds(roi);
  print('Dataset size:', dataset.size());

  var landSurfaceTemperature = dataset.select('ET')
                                      .map(function(image) { 
                                          // Resample the image to 10m resolution and reproject to EPSG:4326
                                          var resampledImage = image.resample('bilinear').reproject({
                                            crs: 'EPSG:4326',
                                            scale: 10 // Target scale for resampling
                                          });
                                          return resampledImage.clip(roi);
                                      });

  var meanLST = landSurfaceTemperature.mean();

  // Export the processed image in EPSG:4326
  Export.image.toDrive({
    image: meanLST.reproject({crs: 'EPSG:4326', scale: 10}),
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

// Iterate over the monthParams, process each month, and add to map
for (var i = 0; i < monthParams.length; i++) {
  var params = monthParams[i];
  processMODISLST(
    params.startDate,
    params.endDate,
    params.outputDescription
  );
}
