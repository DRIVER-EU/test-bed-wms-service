/**
 * Message received from Kafka
 * 
 * @export
 * @interface IMessage
 */
export interface IKafkaMessage {
  topic: string,
  value: string,
  offset: number,
  partition: number,
  key: number
}
