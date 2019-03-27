import {ITestBedOptions} from 'node-test-bed-adapter';
/**
 * Configuration file
 * 
 * @export
 * @interface IConfig
 */
export interface IConfig {
  debugMode?: boolean;
  /**
   * Specifies the WMS Get Capabilities response.
   * 
   * @type {IWmsDescription}
   * @memberOf IConfig
   */
  wmsDescription: IWmsDescription;
  /**
   * Apache Zookeeper URL for Kafka
   * 
   * @type {string}
   * @memberOf IConfig
   */
  zookeeperUrl: string;
  /**
   * Server port
   * 
   * @type {number}
   * @memberOf IConfig
   */
  port: number;
  /**
   * Client ID for Kafka
   * 
   * @type {string}
   * @memberOf IConfig
   */
  clientID: string;
  /**
   * Which topics are you monitoring, and what is the expected file type.
   * 
   * @type {{ [topic: string]: string }}
   * @memberOf IConfig
   */
  consumeTopics: { [topic: string]: string; }
  /**
   * DRIVER+ testbed files.
   * 
   * @type {{ [topic: string]: string }}
   * @memberOf IConfig
   */
  testbed?: {
    sslOptions: {
      pfx?: string;
      passphrase?: string;
      ca?: string;
      cert?: string;
      rejectUnauthorized?: boolean;
    };
    testbedOptions?: ITestBedOptions;
  };
}

export interface IWmsDescription {
  title: string;
  abstract: string;
  keywords: string[];
  path: string;
  /**
   * A string representing the bounding box of the WMS service.
   * Since the GIS files are served dynamically, it needs to be specified manually. By default, the bounding box of The Netherlands is served.
   * 
   * @type {string}
   * @memberOf IConfig
   */
  boundaryBox: string;
  contact: {
    person: string;
    organization: string;
    position: string;
    address: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    telephone: string;
    email: string;
  };
  authority: {
    name: string;
    url: string;
  }
}
