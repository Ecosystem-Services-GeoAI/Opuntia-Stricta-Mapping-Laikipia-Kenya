// Import and filter the Sentinel-2 Cloud Probability dataset.
var laikipia = ee.FeatureCollection('projects/ee-srikantnangondal/assets/Laikipia');

// 1. Function to remove cloud and snow pixels
function maskCloudAndShadows(image) {
  var cloudProb = image.select('MSK_CLDPRB');
  var snowProb = image.select('MSK_SNWPRB');
  var cloud = cloudProb.lt(1);
  var snow = snowProb.lt(1);
  var scl = image.select('SCL'); 
  var shadow = scl.eq(3); // 3 = cloud shadow
  var cirrus = scl.eq(10); // 10 = cirrus
  // Cloud probability less than 5% or cloud shadow classification
  var mask = (cloud.and(snow)).and(cirrus.neq(1)).and(shadow.neq(1));
  return image.updateMask(mask);
}

// 2. Function to resample 20m band to 10m resolutiom
var resampleTo10m = function(image) {
  var bandsToResample = ['B5', 'B6', 'B8A', 'B11', 'B12'];
  var resampledBands = bandsToResample.map(function(band) {
    var bandToResample = image.select(band);
    var resampledBand = bandToResample.resample('bilinear').reproject({
      crs: bandToResample.projection(),
      scale: 10
    }).toInt16(); // Cast to UInt16
    return resampledBand.rename(band + '_resampled');
  });
  return image.addBands(resampledBands); // Add the resampled bands to the image
};

// Defining RGB Visualization parameters
// var image_style = {bands:["B4","B3","B2"],min:0,max:2500,gamma:1.1}

// 3. Selecting bands in final sentnel image
var selectedBands = ['B2', 'B3', 'B4','B5_resampled','B6_resampled','B7','B8','B8A_resampled','B11_resampled','B12_resampled']

// -------4. Function to remove cloud with s2cloudless cloud masking--------------------------------------------------
var start_date = '2023-03-01';
var end_date = '2023-03-31';
var CLOUD_FILTER = 30;
var CLD_PRB_THRESH = 4 /* your cloud probability threshold */;
var NIR_DRK_THRESH = 0.15 /* your NIR dark threshold */;
var CLD_PRJ_DIST = 1
var BUFFER = 50;

function getS2SrCldCol(roi, CLOUD_FILTER, start_date, end_date) {
    // Import and filter Sentinel-2 Surface Reflectance (SR).
    var s2_sr_col = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(roi)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', CLOUD_FILTER))
        .map(maskCloudAndShadows);

    // Import and filter the Sentinel-2 Cloud Probability dataset.
    var s2_cloudless_col = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY')
        .filterBounds(roi)
        .filterDate(start_date, end_date);

    // Join the filtered s2cloudless collection to the SR collection using the 'system:index' property.
    var joined_col = ee.ImageCollection(ee.Join.saveFirst('s2cloudless').apply({
        primary: s2_sr_col,
        secondary: s2_cloudless_col,
        condition: ee.Filter.equals({
            leftField: 'system:index',
            rightField: 'system:index'
        })
    }));

    return joined_col;
}

// Apply the function to build a collection
var s2_sr_cld_col = getS2SrCldCol(roi, CLOUD_FILTER, start_date, end_date)

print('Initial Collection Size:', s2_sr_cld_col.size());

// Cloud components
function addCloudBands(img) {
    // Get s2cloudless image, subset the probability band.
    var cld_prb = ee.Image(img.get('s2cloudless')).select('probability');

    // Condition s2cloudless by the probability threshold value.
    var is_cloud = cld_prb.gt(CLD_PRB_THRESH).rename('clouds');

    // Add the cloud probability layer and cloud mask as image bands.
    return img.addBands(ee.Image([cld_prb, is_cloud]));
}

//Cloud shadow components
function addShadowBands(img) {
    // Identify water pixels from the SCL band.
    var not_water = img.select('SCL').neq(6);

    // Identify dark NIR pixels that are not water (potential cloud shadow pixels).
    var SR_BAND_SCALE = 1e4;
    var dark_pixels = img.select('B8').lt(NIR_DRK_THRESH * SR_BAND_SCALE).multiply(not_water).rename('dark_pixels');

    // Determine the direction to project cloud shadow from clouds (assumes UTM projection).
    var shadow_azimuth = ee.Number(90).subtract(ee.Number(img.get('MEAN_SOLAR_AZIMUTH_ANGLE')));

    // Project shadows from clouds for the distance specified by the CLD_PRJ_DIST input.
    var cld_proj = img.select('clouds').directionalDistanceTransform(shadow_azimuth, CLD_PRJ_DIST * 10)
        .reproject({crs: img.select(0).projection(), scale: 100})
        .select('distance')
        .mask()
        .rename('cloud_transform');

    // Identify the intersection of dark pixels with cloud shadow projection.
    var shadows = cld_proj.multiply(dark_pixels).rename('shadows');

    // Add dark pixels, cloud projection, and identified shadows as image bands.
    return img.addBands(ee.Image([dark_pixels, cld_proj, shadows]));
}

// Final cloud-shadow mask
function addCldShdwMask(img) {
    // Add cloud component bands.
    var imgCloud = addCloudBands(img);

    // Add cloud shadow component bands.
    var imgCloudShadow = addShadowBands(imgCloud);

    // Combine cloud and shadow mask, set cloud and shadow as value 1, else 0.
    var isCldShdw = imgCloudShadow.select('clouds').add(imgCloudShadow.select('shadows')).gt(0);

    // Remove small cloud-shadow patches and dilate remaining pixels by BUFFER input.
    // 20 m scale is for speed, and assumes clouds don't require 10 m precision.
    isCldShdw = isCldShdw.focalMin(2).focalMax(BUFFER * 2 / 20)
        .reproject({crs: img.select([0]).projection(), scale: 20})
        .rename('cloudmask');

    // Add the final cloud-shadow mask to the image.
    return imgCloudShadow.addBands(isCldShdw);
}

// Define cloud mask application function
function applyCldShdwMask(img) {
    // Subset the cloudmask band and invert it so clouds/shadows are 0, else 1.
    var notCldShdw = img.select('cloudmask').not();

    // Subset reflectance bands and update their masks, return the result.
    return img.updateMask(notCldShdw);
}

// Process the collection
var dataset = (s2_sr_cld_col.map(addCldShdwMask)
                             .map(applyCldShdwMask))

print('After Cloud and Shadow Masking:', dataset.size());

// ----------- 4. over --------------------------------------------------------------------

// 5. Creating cloud quality band
var dataset = dataset.map(function(img) {
  var cldProb = img.select('MSK_CLDPRB');
  var cldProbInv = cldProb.multiply(-1).rename('quality');
  return img.addBands(cldProbInv);
});

print('After Adding Cloud Quality Band:', dataset.size());

// 6. Applying Reampling 
var dataset = dataset.map(resampleTo10m);

print('After Resampling to 10m:', dataset.size());

// 7. Illumination
var dem = ee.Image("USGS/SRTMGL1_003");
// Function to calculate illumination condition (IC). Function by Patrick Burns
function illuminationCondition(img){

  // Extract image metadata about solar position
    var SZ_rad = ee.Image.constant(ee.Number(img.get('MEAN_SOLAR_ZENITH_ANGLE'))).multiply(3.14159265359).divide(180).clip(img.geometry().buffer(10000));
    var SA_rad = ee.Image.constant(ee.Number(img.get('MEAN_SOLAR_AZIMUTH_ANGLE')).multiply(3.14159265359).divide(180)).clip(img.geometry().buffer(10000));

  // Creat terrain layers
    var slp = ee.Terrain.slope(dem).clip(img.geometry().buffer(10000));
    var slp_rad = ee.Terrain.slope(dem).multiply(3.14159265359).divide(180).clip(img.geometry().buffer(10000));
    var asp_rad = ee.Terrain.aspect(dem).multiply(3.14159265359).divide(180).clip(img.geometry().buffer(10000));
 
    // Calculate the Illumination Condition (IC)
    // slope part of the illumination condition
    var cosZ = SZ_rad.cos();
    var cosS = slp_rad.cos();
    var slope_illumination = cosS.expression("cosZ * cosS",
                                          {'cosZ': cosZ,
                                           'cosS': cosS.select('slope')});


    // aspect part of the illumination condition
    var sinZ = SZ_rad.sin();
    var sinS = slp_rad.sin();
    var cosAziDiff = (SA_rad.subtract(asp_rad)).cos();
    var aspect_illumination = sinZ.expression("sinZ * sinS * cosAziDiff",
                                           {'sinZ': sinZ,
                                            'sinS': sinS,
                                            'cosAziDiff': cosAziDiff});

    // full illumination condition (IC)
    var ic = slope_illumination.add(aspect_illumination);
 
    // Add IC to original image
    var img_plus_ic = ee.Image(img.addBands(ic.rename('IC')).addBands(cosZ.rename('cosZ')).addBands(cosS.rename('cosS')).addBands(slp.rename('slope')));
    return img_plus_ic;
}
// Function to apply the Sun-Canopy-Sensor + C (SCSc) correction method to each
// Function to apply the Sun-Canopy-Sensor + C (SCSc) correction method to each image
function illuminationCorrection(img) {
    var props = img.toDictionary();
    var st = img.get('system:time_start');

    var img_plus_ic = img;
    var mask2 = img_plus_ic.select('slope').gte(5)
                            .and(img_plus_ic.select('IC').gte(0));
    var img_plus_ic_mask2 = img_plus_ic.updateMask(mask2);

    // Specify Bands to topographically correct
    var bandList = ['B2', 'B3', 'B4','B5','B6','B7','B8','B8A','B11','B12'];
    var compositeBands = img.bandNames();
    var nonCorrectBands = img.select(compositeBands.removeAll(bandList));

    var geom = ee.Geometry(img.get('system:footprint')).bounds().buffer(10000);

    function apply_SCSccorr(band) {
        var method = 'SCSc';
        var out = ee.Image(1).addBands(img_plus_ic_mask2.select('IC', band))
                            .reduceRegion({
                                reducer: ee.Reducer.linearRegression(2,1),
                                geometry: ee.Geometry(img.geometry()),
                                scale: 10,
                                bestEffort: true,
                                maxPixels: 1e13
                            });

        var fit = out.combine({"coefficients": ee.Array([[1],[1]])}, false);

        // Get the coefficients as a nested list,
        // cast it to an array, and get just the selected column
        var out_a = ee.Array(fit.get('coefficients')).get([0,0]);
        var out_b = ee.Array(fit.get('coefficients')).get([1,0]);
        var out_c = out_a.divide(out_b);

        // Apply the SCSc correction
        var SCSc_output = img_plus_ic_mask2.expression(
            "((image * (cosB * cosZ + cvalue)) / (ic + cvalue))", {
                'image': img_plus_ic_mask2.select(band),
                'ic': img_plus_ic_mask2.select('IC'),
                'cosB': img_plus_ic_mask2.select('cosS'),
                'cosZ': img_plus_ic_mask2.select('cosZ'),
                'cvalue': out_c
            });

        return SCSc_output;
    }

    var img_SCSccorr = ee.Image(bandList.map(apply_SCSccorr)).addBands(img_plus_ic.select('IC'));

    var bandList_IC = ee.List(bandList.concat(['IC']));
    img_SCSccorr = img_SCSccorr.unmask(img_plus_ic.select(bandList_IC)).select(bandList);

    return img_SCSccorr.addBands(nonCorrectBands).setMulti(props).set('system:time_start', st);
}

function topoCorrection(collection){
    
    //call function to calculate illumination condition
    var collection_after_illuminationCondition = collection.map(illuminationCondition);
    
    //call function to calculate illumination Correction
    var collection_after_illuminationCorrection = collection_after_illuminationCondition.map(illuminationCorrection);

    return(collection_after_illuminationCorrection)}

var dataset = topoCorrection(dataset);

print('After Illumination Correction:', dataset.size());

// 7. Mosiacking based on 'quality' band created
var image = dataset.qualityMosaic('quality');

print('After Quality Mosaic:', image.bandNames());

// 8. Clipping to Lakipia County 
var dataset_final = image.clip(roi);
var dataset_final = dataset_final.toInt16();
var dataset_toDrive = dataset_final.select(selectedBands);

print('After Clipping:', dataset_toDrive.bandNames());

// 9. Exporting Satellite Image

Export.image.toDrive({
  image: dataset_toDrive,
  description: '2023_Data',
  folder: 'Cactus',
  region: roi,
  scale: 10,
  maxPixels: 1e13,
  crs: 'EPSG:4326'
});


// Map.addLayer(dataset, image_style, 'Original Image');
// Map.centerObject(roi, 8);
