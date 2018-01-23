export enum MapnikStyleType {
  GeoJsonPoint,
  GeoJsonPolygon,
  GeoJsonLine,
  Grid
}

export interface IMapnikStyle {
  filename: string;
  layer: string;
  // style: MapnikStyleType;
}
