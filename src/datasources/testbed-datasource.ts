import * as fs from 'fs';
import * as path from 'path';
import Axios, {AxiosStatic, AxiosResponse, AxiosError} from 'axios';
import {IConfig} from '../models/config';
import {IKafkaMessage} from '../models/kafka_message';
import {ICommandLineOptions} from '../cli';
import {TestBedAdapter, ITestBedOptions, IAdapterMessage, ILargeDataUpdate, DataType} from 'node-test-bed-adapter';
import {INamedGeoJSON} from '../models/named-geojson';
import {FeatureCollection} from 'geojson';

const log = console.log.bind(console),
  log_error = console.error.bind(console);
const stringify = (m: string | Object) => (typeof m === 'string' ? m : JSON.stringify(m, null, 2)).substring(0, 100);

export class TestbedDatasource {
  private adapter: TestBedAdapter;
  private id = 'geojson-wms-gateway';
  private debugMode: boolean;

  constructor(private outputFolder: string, private options: ICommandLineOptions) {
    if (!options.config) options.config = {} as IConfig;
    if (!options.config.testbed) options.config.testbed = {} as any;
    options.config.clientID = options.config.clientID || this.id;
    this.id = options.config.clientID;

    this.adapter = new TestBedAdapter(options.config.testbed.testbedOptions);
    this.adapter.on('error', e => {
      log_error(e);
    });
    this.adapter.on('ready', () => {
      console.log('Producer is connected');
    });
    this.connectAdapter(options.config.testbed.testbedOptions);
  }

  private connectAdapter(options: ITestBedOptions, retries: number = 0) {
    this.adapter
      .connect()
      .then(() => {
        console.log(`Initialized test-bed-adapter correctly`);
        this.adapter.on('message', message => this.handleMessage(message));
      })
      .catch(err => {
        log_error(`Initializing test-bed-adapter failed: ${err}`);
        if (retries < options.maxConnectionRetries) {
          retries += 1;
          let timeout = options.retryTimeout;
          log(`Retrying to connect in ${timeout} seconds (retry #${retries})`);
          setTimeout(() => this.connectAdapter(options, retries), timeout * 1000);
        }
      });
  }

  private handleMessage(message: IAdapterMessage) {
    switch (message.topic.toLowerCase()) {
      case 'system_heartbeat':
        // log.info(`Received heartbeat message with key ${stringify(message.key)}: ${stringify(message.value)}`);
        break;
      case 'system_configuration':
        // log.info(`Received configuration message with key ${stringify(message.key)}: ${stringify(message.value)}`);
        break;
      case 'standard_cap':
        break;
      case 'lcms_plots':
      case 'test_plots':
      case 'crisissuite_htm_plots':
      case 'crisissuite_stedin_plots':
      case 'flood_prediction_geojson':
        // log(`Received plots message with key ${stringify(message.key)}}`);
        this.handleGeoJSONMessage(message);
        break;
      case 'flood_actual':
      case 'flood_actual_lcms':
      case 'flood_prediction_netcdf':
        // log(`Received flood_actual message with key ${stringify(message.key)}: ${stringify(message.value)}`);
        this.handleLargeDataMessage(message);
        break;
      default:
        log(`Received ${message.topic} message with key ${stringify(message.key)}: ${stringify(message.value)}`);
        break;
    }
  }

  /**
   * Save a message to file.
   *
   * @private
   * @param {IKafkaMessage} message
   *
   * @memberOf Router
   */
  private saveMessage(message: IKafkaMessage) {
    let ext = this.options.config.consumeTopics[message.topic];
    let filename = path.join(this.outputFolder, message.topic + '.' + ext);
    if (this.options.config.debugMode) console.log(`Received message, saving to ${filename}.`);
    fs.writeFile(filename, message.value, err => {
      if (err) console.error(err);
    });
  }

  private handleGeoJSONMessage(message: IAdapterMessage) {
    console.log(`Received geojson`);
    const msg: INamedGeoJSON = message.value as INamedGeoJSON;
    const fileTitle = !msg.properties ? 'none' : !msg.properties.name ? 'noname' : msg.properties.name;
    const filename = this.createFilename(fileTitle, 'geojson');
    if (msg.geojson) {
      this.writeGeojsonEnvelope(msg.geojson, filename, fileTitle);
    }
  }

  private handleLargeDataMessage(message: IAdapterMessage) {
    console.log(`Received LargeDataUpdate`);
    const msg: ILargeDataUpdate = message.value as ILargeDataUpdate;
    if (msg.url && msg.dataType && msg.dataType === DataType.geojson) {
      Axios.get(msg.url)
        .then((body: AxiosResponse) => {
          console.log(`Downloaded ${msg.title} ${msg.dataType}:`);
          const filename = this.createFilename(msg.title, msg.dataType);
          fs.writeFile(filename, JSON.stringify(body.data), err => {
            if (err) console.error(`Error saving ${filename}: ${err.message}!`);
            console.log(`Wrote ${filename}`);
          });
        })
        .catch((err: AxiosError) => {
          console.error(err.message);
          console.log(err.config);
        });
    }
  }

  private writeGeojsonEnvelope(geojson: FeatureCollection, filename: string, fileTitle: string) {
    delete geojson.bbox;
    if (geojson.features)
      geojson.features.forEach((f, index) => {
        delete f.bbox;
        if (!f.geometry.type) {
          const keys = Object.keys(f.geometry);
          if (keys.length >= 1) f.geometry = f.geometry[keys[0]];
        }
        if (f.properties) {
          Object.keys(f.properties).forEach(p => {
            if (f.properties[p].hasOwnProperty('string')) f.properties[p] = f.properties[p]['string'];
            if (f.properties[p].hasOwnProperty('int')) f.properties[p] = f.properties[p]['int'];
            if (f.properties[p].hasOwnProperty('float')) f.properties[p] = f.properties[p]['float'];
            if (f.properties[p].hasOwnProperty('double')) f.properties[p] = f.properties[p]['double'];
            if (f.properties[p].hasOwnProperty('long')) f.properties[p] = f.properties[p]['long'];
            if (f.properties[p].hasOwnProperty('boolean')) f.properties[p] = f.properties[p]['boolean'];
          });
          if (!f.properties.Name && f.properties.name) {
            f.properties.Name = f.properties.name;
          }
        }
      });
    fs.writeFile(filename, JSON.stringify(geojson), err => {
      if (err) console.error(`Error saving ${filename}: ${err.message}!`);
      console.log(`Wrote ${filename}`);
    });
  }

  protected createFilename(key: string = 'default', ext: string) {
    if (typeof key !== 'string' && (<any>key).string) key = (<any>key).string;
    const keyFiltered = key.replace(/[^a-zA-Z0-9 -]/g, '');
    return path.join(this.outputFolder, `${keyFiltered.toLowerCase()}.${ext}`);
  }

  /**
   * Close consumer
   *
   * @memberOf Router
   */
  public close() {}
}
