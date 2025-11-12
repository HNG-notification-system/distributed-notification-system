import os
import pika

# === Configuration ===
RABBITMQ_URL = os.getenv(
    "RABBITMQ_URL",
    "amqps://bfvrgswc:X1PaMHdb5txqad3uxJ_2LIirjK1WiTgG@hawk.rmq.cloudamqp.com/bfvrgswc"
)
QUEUE_NAME = os.getenv("RABBITMQ_QUEUE_NAME", "push.queue")


def connect_to_rabbitmq():
    """Establish connection to RabbitMQ using the given URL."""
    print("🔌 Connecting to RabbitMQ...")
    params = pika.URLParameters(RABBITMQ_URL)
    connection = pika.BlockingConnection(params)
    print(" Connected successfully.")
    return connection


def list_queues(channel):
    """List all queues with their message counts."""
    print("\n Listing all queues:")
    queues = channel.queue_declare(queue='', passive=True)  # passive test for connection

    # For CloudAMQP, you can’t enumerate all queues without the management HTTP API,
    # but you can check specific ones.
    # We'll check the default queue (push.queue) for this example.
    try:
        q = channel.queue_declare(queue=QUEUE_NAME, passive=True)
        print(f" - {QUEUE_NAME}: {q.method.message_count} messages")
    except Exception as e:
        print(f"  Could not check queue '{QUEUE_NAME}': {e}")


def read_message(channel, queue_name):
    """Read one message from the queue, if available."""
    print(f"\n Checking for messages in '{queue_name}'...")
    method_frame, header_frame, body = channel.basic_get(queue_name)

    if method_frame:
        print(f" Message received: {body.decode()}")
        channel.basic_ack(method_frame.delivery_tag)
    else:
        print("📭 No messages in queue.")


def main():
    try:
        connection = connect_to_rabbitmq()
        channel = connection.channel()

        list_queues(channel)
        read_message(channel, QUEUE_NAME)

        connection.close()
        print("\n Connection closed.")
    except Exception as e:
        print(f" Error: {e}")


if __name__ == "__main__":
    main()
