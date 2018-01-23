# WMS-LITE

WMS-LITE is a simple NODE (v8.9) service that you can easily run locally and which serves a folder of GIS files as WMS v1.1.1. When a file is changed, the map will be renewed on the next refresh. Besides being a WMS server, it can also act as a tile services, serving tiles using the slippy map tile layer protocol (http://HOST:PORT/layer1,layer2,layer3/zoom/x/y.png). Furthermore, an Apache Kafka connector can be enabled, which can extract files from Kafka and save them in the local data folder.

Each GIS file that is served needs to have a specific Mapnik XML configuration: For examples, see the styles folder.

# Installation

Run and transpile the typescript code to javascript. 
```console
yarn
yarn global add typescript
tsc
```

Run `wms_lite -?` to see the command line options. 

See the required environment settings in launch.json 
- "GDAL_DATA": "c:/Program Files/QGIS 2.16/share/epsg_csv" (I use the version from QGIS),
- "PROJ_LIB": "[YOUR_INSTALLATION_FOLDER]/nad"

So on Windows, you would typically run
```console
set GDAL_DATA="c:/Program Files/QGIS 2.16/share/epsg_csv"
set PROJ_LIB="[YOUR_INSTALLATION_FOLDER]/nad"
```

# Configuration
Each GeoJSON file that you wish to display needs a Mapnik style setting (typically created using [Tilemill](https://github.com/tilemill-project/tilemill) in CartoCSS and exporting to Mapnik XML files). Some example settings can be found in the `styles` folder. E.g. a GeoJSON file called `./data/care.geojson` would require a `./style/care.xml` Mapnik configuration.

NOTE: We only use SVG icons in order to style them properly.

In addition, the `config.json` file specifies the bounding box of the WMS service. As all layers are generated dynamically, we cannot know it automatically.

# Usage

```console
WMS Service for Kafka

  Run a WMS service that gets GIS files either from a folder, or from Apache
  Kafka.

Options

  -?, --help Help                       Display help information.
  -k, --useKafka Use Kafka datasource   If true, use Kafka as a datasource.
  -f, --folder Input folder             Use a folder for the files (default ./data).
  -s, --styleFolder Style folder        Folder for the style files (default ./styles).
  -p, --port Server port                Port for the server to use (default 3355).
  -c, --concurrency Concurrency         Number of concurrent Mapnik maps (default 10).
  -b, --bufferSize Buffer size          Buffer size around map tiles (default 0).
  -a, --palette Palette file            Used by Mapnik.
```

# Run example
Start using `wms_lite -p 5101` or `node dist/run.js -p 5101`. 
Run a local leaflet by starting `cd demo && lite-server` (assuming you have `lite-server` installed locally. Otherwise, install it using `yarn global add lite-server`.

# TODO

- Specify WMS refresh time (Cache-Content)
- Bounding box in config.json
- Automatically create styles for point features

## WMS validator service;
http://validator.spatineo.com/

URI: /?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&BBOX=4.718236993409114177,52.32686932658599943,5.178970733550033678,52.52422983969946557&SRS=EPSG:4326&WIDTH=1890&HEIGHT=810&LAYERS=cap&STYLES=,&FORMAT=image/png&DPI=120&MAP_RESOLUTION=120&FORMAT_OPTIONS=dpi:120&TRANSPARENT=TRUE

GetCapabilities request: http://localhost:3355//?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities