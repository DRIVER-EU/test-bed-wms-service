import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { Router } from './router';
import { ICommandLineOptions } from './cli';
import { IWmsQuery } from './models/wms-query';
import { IWmsDescription } from './models/config';
import { SlippyMap } from './utils/slippy-map';
import { IpAddress } from './utils/utils';

const url = require('url');

export class Server {
  private router: Router;

  constructor(options: ICommandLineOptions) {
    this.router = new Router(options);

    console.log(`Environment variable GDAL_DATA: ${process.env.GDAL_DATA}`);
    console.log(`Environment variable PROJ_LIB: ${process.env.PROJ_LIB}`);

    process.on('SIGINT', () => {
      this.router.close();
      process.exit(0);
    });

    // let isPNG = (data: Buffer) => {
    //   return data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E &&
    //     data[3] === 0x47 && data[4] === 0x0D && data[5] === 0x0A &&
    //     data[6] === 0x1A && data[7] === 0x0A;
    // };

    let favicon = fs.readFileSync(path.join(process.cwd(), 'favicon.ico'));

    const slippyMapRegex = /([a-z\d\,\.]+)\/(\d{1,2})\/(\d{1,6})\/(\d{1,6}).png/i;

    let server = http.createServer((req, res) => {
      let uri: {
        auth: string;
        hash: string;
        host: string;
        hostname: string;
        href: string;
        path: string;
        pathname: string;
        port: string;
        protocol: string;
        query: IWmsQuery;
        search: string;
        slashes: string;
      } = url.parse(req.url.toLowerCase(), true);

      if (uri.path === '/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'image/x-icon' });
        res.end(favicon);
        return;
      }

      if (!uri.query) return;

      if (uri.query.request === 'getcapabilities') {
        res.writeHead(200, { 
          'Content-Type': 'text/xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        return res.end(this.router.getCapabilities());
      }

      if (uri.query.request === 'getmap') {
        console.log(`URI: ${req.url}`);
        return this.createTile(uri.query, res);
      }

      // Try slippy map
      let m = slippyMapRegex.exec(uri.path);
      if (m) {
        // console.log(`URI: ${req.url}`);
        // WMTS slippy map tiles
        // layers/13/4201/2687.png
        let query = <IWmsQuery>{
          layers: m[1],
          bbox: SlippyMap.bboxXYZ(+m[3], +m[4], +m[2]),
          //srs: 'epsg:3857',
          request: 'getmap'
        };
        console.log(`URI: ${req.url} ==> layer: ${m[1]}, bbox: ${query.bbox}`);
        return this.createTile(query, res);
      }

      console.error(`Received unhandled request: ${req.url}`);
      res.writeHead(500, {
          'Content-Type': 'text/plain; charset=utf-8'
      });
      res.end(`Received unhandled request: ${req.url}`);
    });

    server.listen(options.port, () => {
      let address = server.address();
      let ip = options.externalHost || IpAddress.get();
      console.warn('Listening at %s:%d', ip, address.port);
    });
  }

  private createTile(query: IWmsQuery, res: http.ServerResponse) {
    this.router.render(query, (err, tile) => {
      if (err || !tile || !this.isPNG(tile)) {
        res.writeHead(500, {
          'Content-Type': 'text/plain; charset=utf-8'
        });
        res.end(err ? err.stack : 'Rendering didn\'t produce a proper tile');
      } else {
        res.writeHead(200, {
          'Content-Length': tile.length,
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.end(tile);
      }
    });
  }

  /**
   * Check whether the buffer contains a valid PNG.
   * 
   * @private
   * @param {Buffer} data
   * @returns
   * 
   * @memberOf Server
   */
  private isPNG(data: Buffer) {
    return data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E &&
      data[3] === 0x47 && data[4] === 0x0D && data[5] === 0x0A &&
      data[6] === 0x1A && data[7] === 0x0A;
  }

}
