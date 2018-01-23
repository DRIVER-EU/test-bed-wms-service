const R2D = 180 / Math.PI,
  D2R = Math.PI / 180,
  TWO_PI = Math.PI * 2,
  F = 20037508.34 / 180;
/**
 * Utility class to convert slippy map z/x/y.png URI to WMS request
 * See also: https://github.com/mapbox/node-sphericalmercator/blob/master/sphericalmercator.js
 * 
 * @export
 * @class SlippyMap
 */
export class SlippyMap {
  /**
   * Convert a slippy map z/x/y.png URI to a WMS request.
   * 
   * See also: https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
   * @private
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns
   * 
   * @memberOf Server
   */
  public static bbox(x: number, y: number, z: number) {
    return `${SlippyMap.tile2long(x, z)},${SlippyMap.tile2lat(y + 1, z)},${SlippyMap.tile2long(x + 1, z)},${SlippyMap.tile2lat(y, z)}`;
  }

  /**
   * Bounding box for slippy maps in EPSG:3857
   * 
   * @static
   * @param {number} x
   * @param {number} y
   * @param {number} zoom
   * @returns
   * 
   * @memberOf SlippyMap
   */
  public static bboxXYZ(x: number, y: number, z: number) {
    let lonMin = SlippyMap.tile2long(x, z);
    let latMin = SlippyMap.tile2lat(y + 1, z);
    let lonMax = SlippyMap.tile2long(x + 1, z);
    let latMax = SlippyMap.tile2lat(y, z);
    let xyMin = SlippyMap.wgs84toGoogleBing(lonMin, latMin);
    let xyMax = SlippyMap.wgs84toGoogleBing(lonMax, latMax);
    return `${xyMin[0]},${xyMin[1]},${xyMax[0]},${xyMax[1]}`;
  }

  /**
   * Convert WGS84 to EPSG:3857 Web Mercator for use in Google and Bing.
   * See also: https://alastaira.wordpress.com/2011/01/23/the-google-maps-bing-maps-spherical-mercator-projection/
   * 
   * @static
   * @param {number} lon
   * @param {number} lat
   * @returns
   * 
   * @memberOf SlippyMap
   */
  public static wgs84toGoogleBing(lon: number, lat: number) {
    let x = lon * F;
    let y = (Math.log(Math.tan((90 + lat) * D2R / 2)) / D2R) * F;
    return [x, y];
  }

  private static tile2long(x, z) {
    return (x / Math.pow(2, z) * 360 - 180);
  }

  private static tile2lat(y, z) {
    var n = Math.PI - TWO_PI * y / Math.pow(2, z);
    return (R2D * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
  }
}
