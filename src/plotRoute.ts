import { createCanvas } from "canvas";
import { TrackPoint } from "./tcxParser";
import * as fs from "fs";

export function generateRouteImage(
  trackpoints: TrackPoint[],
  outputPath: string
) {
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;

  // Normalize coordinates to fit within the canvas
  const minLat = Math.min(...trackpoints.map((p) => p.latitude));
  const maxLat = Math.max(...trackpoints.map((p) => p.latitude));
  const minLon = Math.min(...trackpoints.map((p) => p.longitude));
  const maxLon = Math.max(...trackpoints.map((p) => p.longitude));

  const scaleX = width / (maxLon - minLon);
  const scaleY = height / (maxLat - minLat);

  ctx.beginPath();
  trackpoints.forEach((point, index) => {
    const x = (point.longitude - minLon) * scaleX;
    const y = height - (point.latitude - minLat) * scaleY;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  // Save image
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Route image saved to ${outputPath}`);
}