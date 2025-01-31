import * as gdal from "gdal-async";

export function generateGeoTIFF(
  inputPng: string,
  outputTiff: string,
  bbox: { minLon: number; maxLon: number; minLat: number; maxLat: number }
) {
  const dataset = gdal.open(inputPng);
  const driver = gdal.drivers.get("GTiff");

  const geotransform = [
    bbox.minLon, // Upper-left X
    (bbox.maxLon - bbox.minLon) / dataset.rasterSize.x, // Pixel width
    0,
    bbox.maxLat, // Upper-left Y
    0,
    -(bbox.maxLat - bbox.minLat) / dataset.rasterSize.y, // Pixel height
  ];

  const tiff = driver.create(outputTiff, dataset.rasterSize.x, dataset.rasterSize.y, 3);
  tiff.geoTransform = geotransform;
  tiff.srs = gdal.SpatialReference.fromEPSG(4326); // WGS84

  for (let i = 1; i <= 3; i++) {
    tiff.bands.get(i).pixels.write(0, 0, dataset.rasterSize.x, dataset.rasterSize.y, dataset.bands.get(i).pixels.read(0, 0, dataset.rasterSize.x, dataset.rasterSize.y));
  }

  tiff.flush();
  console.log(`GeoTIFF saved to ${outputTiff}`);
}
