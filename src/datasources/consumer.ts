// UNCOMMENT IF YOU WANT TO ENHANCE THE LOG OUTPUT OF KAFKA
// import { consoleLoggerProvider } from './console-logger-provider';
// const kafkaLogging = require('kafka-node/logging');
// kafkaLogging.setLoggerProvider(consoleLoggerProvider);
import * as path from 'path';
import * as fs from 'fs';
import {Message} from 'kafka-node';
import {TestBedAdapter, Logger, LogLevel, ITopicMetadataItem, ITestBedOptions} from 'node-test-bed-adapter';
import {CapProcessor} from '../models/capProcessor';
import {Alert} from '../models/ICAP';
import {FeatureCollection, GeometryObject, GeoJsonProperties} from 'geojson';

export class Consumer {
    private adapter: TestBedAdapter;
    private log = Logger.instance;
    private outputFolder: string;
    private capProcessor: CapProcessor = new CapProcessor();

    constructor(options: ITestBedOptions, storeFolder: string) {
        this.outputFolder = path.resolve(storeFolder);
        if (!path.isAbsolute(this.outputFolder)) {
            this.outputFolder = path.join(process.cwd(), this.outputFolder);
        }
        if (!fs.existsSync(this.outputFolder)) {
            this.log.debug(`Created output folder: ${this.outputFolder}.`);
            fs.mkdirSync(this.outputFolder);
        }

        this.log.info(`Consuming ${JSON.stringify(options.consume)}, output folder ${this.outputFolder}.`);

        this.adapter = new TestBedAdapter(options);
        this.adapter.on('ready', () => {
            this.subscribe();
            this.log.info('Consumer is connected');
            this.getTopics();
        });
        this.adapter.on('error', err => {
            this.log.error(`Consumer received an error: ${err}`);
        });
        this.adapter.connect();
    }

    private subscribe() {
        this.adapter.on('message', message => this.handleMessage(message));
        this.adapter.on('offsetOutOfRange', err => this.log.error(`Consumer received an error: ${err}`));
        this.adapter.addConsumerTopics({topic: TestBedAdapter.HeartbeatTopic}).catch(err => {
            if (err) {
                this.log.error(`Consumer received an error: ${err}`);
            }
        });
    }

    private getTopics() {
        this.adapter.loadMetadataForTopics([], (error, results) => {
            if (error) {
                return this.log.error(error);
            }
            if (results && results.length > 0) {
                results.forEach(result => {
                    if (result.hasOwnProperty('metadata')) {
                        console.log('TOPICS');
                        const metadata = (result as {[metadata: string]: {[topic: string]: ITopicMetadataItem}}).metadata;
                        for (let key in metadata) {
                            const md = metadata[key];
                            console.log(`Topic: ${key}, partitions: ${Object.keys(md).length}`);
                        }
                    } else {
                        console.log('NODE');
                        console.log(result);
                    }
                });
            }
        });
    }

    private handleMessage(message: Message) {
        switch (message.topic.toLowerCase()) {
            case 'connect-status-heartbeat':
                this.log.info(`Received message on topic ${message.topic} with key ${message.key}: ${message.value}`);
                break;
            case 'connect-status-configuration':
                this.log.info(`Received message on topic ${message.topic} with key ${message.key}: ${message.value}`);
                break;
            default:
                this.log.info(`Received message on topic ${message.topic}: ${message.value}`);
                this.saveMessage(message);
                break;
        }
    }

    /**
     * Save a message to file.
     *
     * @private
     * @param {Message} message
     *
     * @memberOf Router
     */
    private saveMessage(message: Message) {
        let value = message.value;
        if (message.topic === 'cap') {
            let alert = typeof message.value === 'object' ? message.value : JSON.parse(message.value);
            let fts = this.capProcessor.handleIncomingCAP(alert);
            let ftc: FeatureCollection<GeometryObject, GeoJsonProperties> = {type: 'FeatureCollection', features: fts};
            value = JSON.stringify(ftc);
        }
        let ext = 'json';
        let filename = path.join(this.outputFolder, message.topic + '.' + ext);
        this.log.debug(`Received message, saving to ${filename}.`);
        fs.writeFile(filename, value, err => {
            if (err) this.log.error(err.toString());
        });
    }

    /**
     * Close consumer
     *
     * @memberOf Router
     */
    public close() {
        this.adapter.close();
    }
}
