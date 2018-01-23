import * as fs from 'fs';
import * as path from 'path';
import * as Kafka from 'kafka-node';
import { IConfig } from '../models/config';
import { IKafkaMessage } from '../models/kafka_message';
import { ICommandLineOptions } from '../cli';

export class KafkaDatasource {
  private client: Kafka.Client;
  private offset: Kafka.Offset;
  private consumer: Kafka.Consumer;

  private debugMode: boolean;
  private outputFolder: string;

  constructor(private folder: string, private options: ICommandLineOptions) {
    let topics = options.config.consumeTopics ? Object.keys(options.config.consumeTopics) : 'default';
    if (options.hasOwnProperty('debugMode')) this.debugMode = options.config.debugMode;

    this.outputFolder = path.resolve(folder);
    if (!path.isAbsolute(this.outputFolder)) {
      this.outputFolder = path.join(process.cwd(), this.outputFolder);
    }
    if (!fs.existsSync(this.outputFolder)) {
      if (this.debugMode) console.log(`Created output folder: ${this.outputFolder}.`);
      fs.mkdirSync(this.outputFolder);
    }

    if (this.debugMode) {
      console.log(`Consuming ${JSON.stringify(topics)}, output folder ${this.outputFolder}.`)
    }

    const Offset = Kafka.Offset;
    this.client = new Kafka.Client(options.config.zookeeperUrl, options.config.clientID);
    this.offset = new Offset(this.client);
    (<any>this.offset).fetchLatestOffsets(topics, (error, offsets) => this.processOffsets(error, offsets, 1));
  }

  /**
   * Process the received offsets, and start consuming from the one but last offset.
   * 
   * @private
   * @param {any} error
   * @param {any} offsets
   * @param {number} lastXmessages: get the last X messages
   * 
   * @memberOf Router
   */
  private processOffsets(error, offsets, lastXmessages: number) {
    if (error) console.error(error);
    else {
      console.log(`Offsets: ${JSON.stringify(offsets, null, 2)}.`);
      let topics: Kafka.Topic[] = [];

      for (let topic in offsets) {
        if (!offsets.hasOwnProperty(topic)) return;
        for (let partition in offsets[topic]) {
          if (!offsets[topic].hasOwnProperty(partition)) return;
          let offset = offsets[topic][partition];
          topics.push(<Kafka.Topic>{
            topic: topic,
            partition: +partition,
            offset: offset === 0 ? 0 : offset - lastXmessages
          })
        }
      }
      const Consumer = Kafka.Consumer;
      this.consumer = new Consumer(this.client, topics, {
        autoCommit: false,
        fromOffset: true,
        encoding: 'utf8'
      }
      );
      this.consumer.on('message', (message: IKafkaMessage) => {
        this.saveMessage(message);
      });
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
    fs.writeFile(filename, message.value, (err) => {
      if (err) console.error(err);
    });
  }

  /**
   * Close consumer
   * 
   * @memberOf Router
    */
  public close() {
    this.consumer.commit((error, data) => {
      if (error) {
        console.error(error);
      } else {
        console.log(data);
      }
    });
    this.consumer.close(false, () => {
      console.log('Closing consumer...')
      process.exit(0);
    });
  }

}