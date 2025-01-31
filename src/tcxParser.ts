import * as fs from "fs";
import { DOMParser } from "xmldom";

export interface TrackPoint {
  latitude: number;
  longitude: number;
}

export function parseTCX(filePath: string): TrackPoint[] {
  const xml = fs.readFileSync(filePath, "utf-8");
  const doc = new DOMParser().parseFromString(xml, "text/xml");

  const trackpoints: TrackPoint[] = [];
  const nodes = doc.getElementsByTagName("Trackpoint");

  for (let i = 0; i < nodes.length; i++) {
    const latNode = nodes[i].getElementsByTagName("LatitudeDegrees")[0];
    const lonNode = nodes[i].getElementsByTagName("LongitudeDegrees")[0];

    if (latNode && lonNode) {
      trackpoints.push({
        latitude: parseFloat(latNode.textContent || "0"),
        longitude: parseFloat(lonNode.textContent || "0"),
      });
    }
  }

  return trackpoints;
}
