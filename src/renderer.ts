import * as fs from 'fs';
import * as path from 'path';
import { Pool } from './pool';
import { IWmsQuery } from './models/wms-query';
const mapnik = (process.platform === "win32" ? null : require('mapnik'));

// register fonts and datasource plugins
if (mapnik) mapnik.register_default_fonts();
if (mapnik) mapnik.register_default_input_plugins();

export class Renderer {
  private maps: Pool;

  constructor(stylesheet?: string, concurrency?: number, bufferSize?: number, private palette?) {
    if (!stylesheet) throw new Error('Missing stylesheet!');
    stylesheet = path.resolve(stylesheet);
    if (!concurrency) concurrency = 10;
    if (!bufferSize) bufferSize = 0;

    var created = 0;

    this.maps = new Pool(() => {
      var map = new mapnik.Map(256, 256);
      map.bufferSize = bufferSize;
      map.load(stylesheet, {
        strict: true,
        base: path.dirname(stylesheet)
      }, (err, map) => {
        if (err) {
          return console.error(err);
        }
        map.zoomAll();
        created++;
        console.log(`\rCreating map objects (${created}/${concurrency})...`);
        this.maps.release(map);
      });
    }, concurrency);
  }

  render(query: IWmsQuery, callback: Function) {
    let width = +query.width || 256;
    let height = +query.height || 256;
    if (width < 1 || width > 2048 || height < 1 || height > 2048) {
      return callback(new Error('Invalid size: ' + query.width + '×' + query.height));
    }

    let bbox_str = query.bbox ? query.bbox.split(',') : [];
    if (bbox_str.length !== 4) return callback(new Error('Invalid bbox: ' + JSON.stringify(bbox_str)));
    let bbox = bbox_str.map(parseFloat);
    for (var i = 0; i < 4; i++) {
      if (isNaN(bbox[i])) return callback(new Error('Invalid bbox: ' + JSON.stringify(bbox)));
    }

    this.maps.acquire(map => {
      map.resize(width, height);
      if (query.srs) map.srs = '+init=' + query.srs;
      map.extent = bbox;

      var canvas = new mapnik.Image(width, height);
      map.render(canvas, (err, image) => {
        // Wait until the next tick to avoid Mapnik warnings.
        process.nextTick(() => { this.maps.release(map); });

        if (err) {
          callback(err);
        } else {
          if (this.palette) {
            image.encode('png8:z=1', { palette: this.palette }, callback);
          } else {
            image.encode('png32:z=1', callback);
          }
        }
      });
    });
  }
}
