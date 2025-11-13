#!/usr/bin/env node

/**
 * Test script to send email notifications to RabbitMQ
 * Usage: node scripts/send-test-message.js
 */

const amqp = require('amqplib');

const RABBITMQ_URL =
  process.env.RABBITMQ_URL ||
  'amqps://bfvrgswc:X1PaMHdb5txqad3uxJ_2LIirjK1WiTgG@hawk.rmq.cloudamqp.com/bfvrgswc';
const EMAIL_QUEUE = 'email.queue';

// Test notification message
const testNotification = {
  notification_id: `test-${Date.now()}`,
  user_id: 'user123',
  template_id: '1',
  to_email: 'desmondesih@example.com',
  variables: {
    name: 'John Doe',
  },
  priority: 'high',
  correlation_id: `req-${Date.now()}`,
};

async function sendTestMessage() {
  let connection;
  let channel;

  try {
    console.log('Connecting to RabbitMQ...');
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Assert queue exists
    await channel.assertQueue(EMAIL_QUEUE, { durable: true });

    // Send message
    const message = Buffer.from(JSON.stringify(testNotification));
    channel.sendToQueue(EMAIL_QUEUE, message, { persistent: true });

    console.log('✅ Test message sent successfully!');
    console.log('📧 Notification ID:', testNotification.notification_id);
    console.log('📬 Destination:', testNotification.to_email);
    console.log('📝 Template:', testNotification.template_id);
    console.log('\nMessage details:');
    console.log(JSON.stringify(testNotification, null, 2));

    // Close connection
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('❌ Error sending test message:', error.message);
    process.exit(1);
  }
}

// Run the script
sendTestMessage();
