# Test-bed WMS-service

WMS-LITE is a simple NODE (v8) service that you can easily run locally and which serves a folder of GIS files as WMS v1.1.1. When a file is changed, the map will be renewed on the next refresh. Besides being a WMS server, it can also act as a tile services, serving tiles using the slippy map tile layer protocol (http://HOST:PORT/layer1,layer2,layer3/zoom/x/y.png). Furthermore, an Apache Kafka connector can be enabled to connect to the DRIVER+ testbed, which can extract files from configured topics and save them in the local data folder.

Each GIS file that is served needs to have a specific Mapnik XML configuration: For examples, see the styles folder. Otherwise, a default style will be used.

# Installation

Run and transpile the typescript code to javascript. 
```console
npm i && typings i
npm i typescript -g
tsc
npm link
```

Run `test-bed-wms-service -?` to see the command line options. 

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
  -p, --port Server port                Port for the server to use (default 5101).
  -c, --concurrency Concurrency         Number of concurrent Mapnik maps (default 10).
  -b, --bufferSize Buffer size          Buffer size around map tiles (default 0).
  -a, --palette Palette file            Used by Mapnik.
```

# Run example
Start using `test-bed-wms-service -p 5101` or `node dist/run.js -p 5101`. 
Run a local leaflet by starting `cd demo && lite-server` (assuming you have `lite-server` installed locally. Otherwise, install it using `npm i -g lite-server`.

# TODO

- Specify WMS refresh time (Cache-Content)
- Bounding box in config.json
- Automatically create styles for point features

## WMS validator service;
http://validator.spatineo.com/

URI: /?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&BBOX=4.718236993409114177,52.32686932658599943,5.178970733550033678,52.52422983969946557&SRS=EPSG:4326&WIDTH=1890&HEIGHT=810&LAYERS=care,ziekenhuis&STYLES=,&FORMAT=image/png&DPI=120&MAP_RESOLUTION=120&FORMAT_OPTIONS=dpi:120&TRANSPARENT=TRUE

GetCapabilities request: http://localhost:5101//?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities

# DOCKER development
Build a development docker image using the command
```
docker build -t wms-server-dev .
```
Start the image interactively with
```
docker run -p 5101:5101 -v C:\dev\projects\DRIVER\wms-test-bed-adapter\src:/code/src -it --rm wms-server-dev /bin/sh
```
Then run the command ```tsc -w``` in this container to build and watch the source code. 
To run the compiled code, run in the docker container:
```
node dist/cli -t -f demo -e "http://localhost" -q 5101
```
