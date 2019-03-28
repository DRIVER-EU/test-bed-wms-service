import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { ICommandLineOptions } from './cli';
import { IDatasource } from './models/datasource';
import { FolderDatasource } from './datasources/folder-datasource';
import { KafkaDatasource } from './datasources/kafka-datasource';
import { Renderer } from './renderer';
import { IWmsQuery } from './models/wms-query';
import { StyleGenerator } from './stylegenerators/style-generator';
import { WmsGetCapbilities } from './models/wms-get-capabilities';
import { TestbedDatasource } from './datasources/testbed-datasource';
const mapnik = (process.platform === "win32" ? null : require('mapnik'));

export class Router {
  // A dictionary of renderers, each for one particular style.
  private renderers: { [key: string]: { renderer: Renderer; time: Date; } };
  private testbedDatasource: TestbedDatasource;
  private kafkaDatasource: KafkaDatasource;
  private styleGenerator: StyleGenerator;
  private dataSources: IDatasource[];
  private palette;

  constructor(private options: ICommandLineOptions) {
    this.renderers = {};
    this.styleGenerator = new StyleGenerator(options.styleFolder);

    if (options.folder) {
      let folderService = new FolderDatasource(options.folder);
      folderService.on('fileChange', effect => this.processFileChanged(effect));
      folderService.process((err: NodeJS.ErrnoException, datasources?: IDatasource[]) => {
        if (err || !datasources) {
            console.log(JSON.stringify(err));
            throw err;
        }
        this.dataSources = datasources;
      });

      if (options.useKafka) this.kafkaDatasource = new KafkaDatasource(options.folder, options);
      if (options.useTestbed) this.testbedDatasource = new TestbedDatasource(options.folder, options);
    }

    if (mapnik) this.palette = options.palette ? new mapnik.Palette(fs.readFileSync(options.palette), 'act') : false;
  }

  /**
   * Process the effects of a file change.
   * - Update the available datasources
   * - Delete all existing renderers that use this file, so a new one will be created the next time.
   * 
   * @private
   * @param {({ datasource: IDatasource, change: 'add' | 'remove' | 'change'})} change
   * 
   * @memberOf Router
   */
  private processFileChanged(effect: { datasource: IDatasource, change: 'add' | 'remove' | 'change' }) {
    let title = effect.datasource.title;
    let layerID = effect.datasource.layerID;
    switch (effect.change) {
      case 'add':
        this.dataSources.push(effect.datasource);
        break;
      case 'change':
        if (!this.dataSources.some(ds => { return ds.title === title;})) {
          this.dataSources.push(effect.datasource);
        }
        break;
      case 'remove':
        this.dataSources = this.dataSources.filter(ds => ds.title !== title);
        break;
    }
    let outdatedRenderers: string[] = [];
    for (var renderer in this.renderers) {
      if (!this.renderers.hasOwnProperty(renderer)) continue;
      if (renderer !== layerID.toFixed(0) && renderer.indexOf(`${layerID},`) < 0 && renderer.indexOf(`,${layerID}`) < 0) continue;
      outdatedRenderers.push(renderer);
    }
    outdatedRenderers.forEach(r => delete this.renderers[r]);
  }

  public render(query: IWmsQuery, cb: (err: NodeJS.ErrnoException, tile?: Buffer) => void) {
    // let renderer = new Renderer('demo/world_latlon.xml');
    let layers = query.layers;
    if (typeof layers === 'undefined') return cb(new Error('No layer specified!'));
    if (!this.renderers.hasOwnProperty(layers)) {
      this.createNewRenderer(layers);
    }
    try {
      let svc = this.renderers[layers];
      if (!svc.renderer) return cb(new Error(`Couldn't create renderer - missing stylesheet.`)); 
      svc.time = new Date();
      svc.renderer.render(query, cb);
    } catch (err) {
      let msg = `Error rendering map: ${err.message}!`;
      console.error(msg);
      cb(new Error(msg))
    }
  }

  private createNewRenderer(layers) {
    let stylesheet = path.join(this.options.styleFolder, layers + '.xml');
    if (!fs.existsSync(stylesheet)) {
      let selectedLayers = layers.split(',').map(i => +i);
      let selectedDatasources = this.dataSources.filter(ds => selectedLayers.indexOf(ds.layerID) >= 0);
      stylesheet = this.styleGenerator.create(layers, selectedDatasources);
    }
    this.renderers[layers] = {
      time: new Date(),
      renderer: stylesheet && mapnik ? new Renderer(stylesheet, this.options.concurrency, this.options.bufferSize) : null
    };
  }

  /**
   * Respond to a WMS getCapabilities request
   * 
   * @returns
   * 
   * @memberOf Router
   */
  public getCapabilities() {
    return WmsGetCapbilities.create(this.options.config.wmsDescription, this.options.port, this.dataSources, this.options.externalHost, this.options.externalPort);
  }

  public close() {
    if (this.kafkaDatasource) this.kafkaDatasource.close();
  }
}
