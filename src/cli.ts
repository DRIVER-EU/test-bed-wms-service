import * as path from 'path';
import {Server} from './server';
import {IConfig} from './models/config';

const commandLineArgs = require('command-line-args');
const config: IConfig = require(path.join(process.cwd(), 'config.json'));

export interface ICommandLineOptions {
  /**
   * Input folder (default is `./data`)
   *
   * @type {string}
   * @memberOf ICommandLineOptions
   */
  folder: string;
  /**
   * Style folder (default is `./styles`)
   *
   * @type {string}
   * @memberOf ICommandLineOptions
   */
  styleFolder: string;
  /**
   * Get the last X messages.
   *
   * @type {number}
   * @memberOf ICommandLineOptions
   */
  last: number;
  /**
   * Server port
   *
   * @type {number}
   * @memberOf IConfig
   */
  port: number;
  /**
   * Show help information.
   *
   * @type {boolean}
   * @memberOf ICommandLineOptions
   */
  help: boolean;
  /**
   * Configuration options
   *
   * @type {IConfig}
   * @memberOf ICommandLineOptions
   */
  config: IConfig;
  /**
   * The number of concurrent Mapnik maps (default 10)
   *
   * @type {number}
   * @memberOf ICommandLineOptions
   */
  concurrency: number;
  /**
   * Buffer size
   *
   * @type {number}
   * @memberOf ICommandLineOptions
   */
  bufferSize: number;
  /**
   * Palette for Mapnik
   *
   * @type {string}
   * @memberOf ICommandLineOptions
   */
  palette: string;
  /**
   * External Portname
   *
   * @type {number}
   * @memberOf ICommandLineOptions
   */
  externalPort: number;
  /**
   * External hostname
   *
   * @type {string}
   * @memberOf ICommandLineOptions
   */
  externalHost: string;
  /**
   * If true, use the Kafka configuration to watch one or more Kafka topics.
   * But it is the folder datasource that is actually adding the files to the WMS service.
   *
   * @type {boolean}
   * @memberOf ICommandLineOptions
   */
  useKafka: boolean;
  /**
   * If true, use the DRIVER+ testbed configuration to watch one or more topics.
   * But it is the folder datasource that is actually adding the files to the WMS service.
   *
   * @type {boolean}
   * @memberOf ICommandLineOptions
   */
  useTestbed: boolean;
}

export class CommandLineInterface {
  static optionDefinitions = [
    {name: 'help', alias: '?', type: Boolean, multiple: false, typeLabel: '[underline]{Help}', description: 'Display help information.'},
    {name: 'useKafka', alias: 'k', type: Boolean, multiple: false, typeLabel: '[underline]{Use Kafka datasource}', description: 'If true, use Kafka as a datasource.'},
    {name: 'useTestbed', alias: 't', type: Boolean, multiple: false, typeLabel: '[underline]{UseTestbed datasource}', description: 'If true, use the DRIVER+ Testbed as a datasource.'},
    {name: 'folder', alias: 'f', type: String, multiple: false, typeLabel: '[underline]{Input folder}', description: 'Use a folder for the files (default ./data).'},
    {name: 'styleFolder', alias: 's', type: String, multiple: false, typeLabel: '[underline]{Style folder}', description: 'Folder for the style files (default ./styles).'},
    {name: 'port', alias: 'p', type: Number, multiple: false, typeLabel: '[underline]{Server port}', description: 'Port for the server to use (default 5101).'},
    {name: 'concurrency', alias: 'c', type: Number, multiple: false, typeLabel: '[underline]{Concurrency}', description: 'Number of concurrent Mapnik maps (default 10).'},
    {name: 'bufferSize', alias: 'b', type: Number, multiple: false, typeLabel: '[underline]{Buffer size}', description: 'Buffer size around map tiles (default 0).'},
    {name: 'palette', alias: 'a', type: String, multiple: false, typeLabel: '[underline]{Palette file}', description: 'Used by Mapnik.'},
    {name: 'externalHost', alias: 'e', type: String, multiple: false, typeLabel: '[underline]{External host address}', description: 'Use this to define the external hostname when it is not the same as the local hostname.'},
    {name: 'externalPort', alias: 'q', type: String, multiple: false, typeLabel: '[underline]{External port}', description: 'Use this to define the external port-number when it is not the same as the local port.'}
    // { name: 'last', alias: 'l', type: Number, multiple: false, typeLabel: '[underline]{Get last X messages (default 0)}', description: 'Retreive the last X messages.' }
  ];

  static sections = [
    {
      header: 'WMS Service for Kafka',
      content: 'Run a WMS service that gets GIS files either from a folder, or from Apache Kafka.'
    },
    {
      header: 'Options',
      optionList: CommandLineInterface.optionDefinitions
    }
  ];
}

let options: ICommandLineOptions = commandLineArgs(CommandLineInterface.optionDefinitions);

if (options.help) {
  const getUsage = require('command-line-usage');
  const usage = getUsage(CommandLineInterface.sections);
  console.log(usage);
  process.exit(1);
}

if (!options || typeof options !== 'object') options = <ICommandLineOptions>{};
options.folder = options.folder ? path.resolve(options.folder) : path.resolve('data');
options.styleFolder = options.styleFolder ? path.resolve(options.styleFolder) : path.resolve('styles');
if (!options.port) options.port = 5101;
options.last = options.last ? +options.last : 0;
if (!options.palette) options.palette = path.resolve('palette.act');
if (!options.concurrency) options.concurrency = 10;
if (!options.bufferSize) options.bufferSize = 0;
if (typeof options.useKafka === 'undefined') options.useKafka = false;
if (typeof options.useTestbed === 'undefined') options.useTestbed = false;

options.config = config || ({} as IConfig);
if (options.config.testbed && options.config.testbed.testbedOptions) {
  const sf = options.config.testbed.testbedOptions.schemaFolder;
  options.config.testbed.testbedOptions.schemaFolder = sf ? path.resolve(sf) : path.resolve('schemas');
}
if (options.config.debugMode) console.log(`Starting server with options: ${JSON.stringify(options, null, 2)}`);
const server = new Server(options);
