// create-topics.js
const { KafkaClient, Admin } = require('kafka-node');

const client = new KafkaClient({ kafkaHost: 'localhost:9092' });
const admin = new Admin(client);

const topicsToCreate = [
  { topic: 'admin-requests', partitions: 3, replicationFactor: 1 },
  { topic: 'admin-responses', partitions: 3, replicationFactor: 1 },
];

admin.createTopics(topicsToCreate, (error, result) => {
  if (error) {
    console.error('Error creating topics:', error);
  } else {
    console.log('Topics created successfully:', result);
  }
  client.close();
});
