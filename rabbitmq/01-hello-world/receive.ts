import client from "amqplib";
import { dsn, queue } from "./send";
import { inspect } from "util";

(async () => {
  const conn = await client.connect(dsn);
  const ch = await conn.createChannel();
  await ch.assertQueue(queue, { durable: false });

  await ch.consume(
    queue,
    (msg) => {
      // tslint:disable-next-line:no-console
      console.log(`got message: ${msg?.content}`);
    },
    { noAck: true }
  );
})();
