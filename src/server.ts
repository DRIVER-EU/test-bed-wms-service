import * as http from 'http';
import * as cors from 'http-cors';
import * as fs from 'fs';
import * as path from 'path';
import {Router} from './router';
import {ICommandLineOptions} from './cli';
import {IWmsQuery} from './models/wms-query';
import {SlippyMap} from './utils/slippy-map';
import {IpAddress} from './utils/utils';

const url = require('url');
const corsUrl = process.env.WMS_CORS_ORIGIN || '*';
const corsHeaders = process.env.WMS_CORS_HEADERS;

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

      const headers = {
        'Access-Control-Allow-Origin': corsUrl,
        'Access-Control-Request-Method': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
        'Access-Control-Allow-Headers': corsHeaders || req.headers.origin,
        'Access-Control-Allow-Credentials': 'true'
      };

      if (req.method === 'OPTIONS') {
        res.writeHead(200, headers);
        res.end();
        return;
      }

      if (uri.path === '/favicon.ico') {
        res.writeHead(200, Object.assign(headers, {'Content-Type': 'image/x-icon'}));
        res.end(favicon);
        return;
      }

      if (uri.path === '/update/id' || uri.path === '/wms/update/id' || uri.path === '/wms/wms/update/id') {
        res.writeHead(200, Object.assign(headers, {'Content-Type': 'application/json'}));
        res.end(JSON.stringify({app_id: 'wms-driver-plus'}));
        return;
      }

      if (uri.path === '/wms/wms' && !uri.query) {
        res.writeHead(200, Object.assign(headers, {'Content-Type': 'application/json'}));
        res.end(JSON.stringify({app_id: 'wms-driver-plus'}));
        return;
      }

      if (!uri.query) return;

      if (uri.query.request === `getcapabilities`) {
        res.writeHead(
          200,
          Object.assign(headers, {
            'Content-Type': 'text/xml',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0'
          })
        );
        return res.end(this.router.getCapabilities());
      }

      if (uri.query.request === `getmap`) {
        console.log(`URI: ${req.url}`);
        return this.createTile(uri.query, res);
      }

      if (uri.query.request === `version`) {
        console.log(`URI: ${req.url}`);
        res.writeHead(
          200,
          Object.assign(headers, {
            'Content-Type': 'text/plain; charset=utf-8'
          })
        );
        return res.end('test-bed-wms-server version ...');
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

      console.error(`Received unhandled request on ${req.url} (${uri.query.request})`);
      res.writeHead(
        500,
        Object.assign(headers, {
          'Content-Type': 'text/plain; charset=utf-8'
        })
      );
      res.end(`Received unhandled request: ${req.url}`);
    });

    console.log('Start server on port %d', options.port);

    server.listen(options.port, () => {
      const ip = IpAddress.get();
      const address = server.address();
      const port = typeof address === 'string' ? '?' : address.port;
      console.warn('Listening at %s:%d', ip, port);
    });
  }

  private createTile(query: IWmsQuery, res: http.ServerResponse) {
    this.router.render(query, (err, tile) => {
      if (err || !tile || !this.isPNG(tile)) {
        res.writeHead(500, {
          'Content-Type': 'text/plain; charset=utf-8'
        });
        res.end(err ? err.stack : "Rendering didn't produce a proper tile");
      } else {
        res.writeHead(200, {
          'Content-Length': tile.length,
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0'
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
    return data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47 && data[4] === 0x0d && data[5] === 0x0a && data[6] === 0x1a && data[7] === 0x0a;
  }
}
