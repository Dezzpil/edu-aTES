import client, { Channel, Connection } from "amqplib";

export const queue = "01";
export const dsn = "amqp://user:password@localhost:5672";

(async () => {
  const conn: Connection = await client.connect(dsn);
  const ch: Channel = await conn.createChannel();
  const msg = "Hello to RabbitMQ!";

  await ch.assertQueue(queue, { durable: false });
  let sent = 0;
  const it = setInterval(() => {
    if (!ch.sendToQueue(queue, Buffer.from(msg))) {
      throw new Error("sent failed");
    }
    // tslint:disable-next-line:no-console
    console.log(`sent ${sent}`);
    sent++;
  }, 500);

  if (sent > 100) {
    clearInterval(it);
    await conn.close();
    process.exit(0);
  }
  // tslint:disable-next-line:no-console
  console.log("OK");
})();
