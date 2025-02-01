import * as gdal from "gdal-async";

// Load the polyline JSON file
const polylineData = require("../data/polyline.json");

// Function to decode a Google Maps encoded polyline
function decodePolyline(encoded: string): [number, number][] {
  let index = 0;
  const length = encoded.length;
  const coordinates: [number, number][] = [];
  let latitude = 0;
  let longitude = 0;

  while (index < length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    latitude += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    longitude += deltaLng;

    coordinates.push([latitude / 1e5, longitude / 1e5]);
  }

  return coordinates;
}

// Step 1: Decode all polylines and gather their coordinates
const allCoords: [number, number][][] = polylineData.map((entry: any) =>
  decodePolyline(entry.map.summary_polyline)
).filter((coords: string | any[]) => coords.length > 0);

// Step 2: Determine the global bounding box across all polylines
const allLats = allCoords.flat().map(coord => coord[0]);
const allLons = allCoords.flat().map(coord => coord[1]);

const minLon = Math.min(...allLons);
const maxLon = Math.max(...allLons);
const minLat = Math.min(...allLats);
const maxLat = Math.max(...allLats);

const rasterSize = [1000, 1000]; // Width, Height of raster

// Step 3: Define raster transformation (converting lat/lon to pixels)
const geoTransform = [
  minLon,  // xmin (origin)
  (maxLon - minLon) / rasterSize[0], // pixel width
  0,
  maxLat, // ymax (origin)
  0,
  -(maxLat - minLat) / rasterSize[1], // pixel height (negative for correct orientation)
];

// Step 4: Create a new raster dataset
const driver = gdal.drivers.get("GTiff");
const rasterDs = driver.create("polyline_raster.tif", rasterSize[0], rasterSize[1], 1, gdal.GDT_Byte);
rasterDs.geoTransform = geoTransform;
rasterDs.srs = gdal.SpatialReference.fromEPSG(4326); // Use WGS84 coordinate system

// Step 5: Convert geographic coordinates to raster indices
function geoToPixel(lon: number, lat: number): [number, number] {
  const x = Math.floor((lon - geoTransform[0]) / geoTransform[1]);
  const y = Math.floor((lat - geoTransform[3]) / geoTransform[5]);
  return [x, y];
}

// Step 6: Get raster band and initialize the image with zeros
const band = rasterDs.bands.get(1);
const rasterData = new Uint8Array(rasterSize[0] * rasterSize[1]);
rasterData.fill(0);

// Step 7: Loop through all polylines and burn them into the raster
for (const coords of allCoords) {
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = geoToPixel(coords[i][1], coords[i][0]);
    const [x2, y2] = geoToPixel(coords[i + 1][1], coords[i + 1][0]);

    // Bresenham’s line algorithm to draw the polyline onto the raster
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let x = x1, y = y1;
    while (true) {
      if (x >= 0 && x < rasterSize[0] && y >= 0 && y < rasterSize[1]) {
        rasterData[y * rasterSize[0] + x] = 255; // Burn the line with value 255
      }
      if (x === x2 && y === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }
}

// Step 8: Write data to raster band and save
band.pixels.write(0, 0, rasterSize[0], rasterSize[1], rasterData);
rasterDs.flush(); // Save the raster file
console.log("Rasterized polyline saved as polyline_raster.tif");
