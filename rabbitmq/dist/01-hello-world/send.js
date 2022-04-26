"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dsn = exports.queue = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
exports.queue = "01";
exports.dsn = "amqp://user:password@localhost:5672";
(() => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield amqplib_1.default.connect(exports.dsn);
    const ch = yield conn.createChannel();
    const msg = "Hello to RabbitMQ!";
    yield ch.assertQueue(exports.queue, { durable: false });
    let sent = 0;
    const it = setInterval(() => {
        if (!ch.sendToQueue(exports.queue, Buffer.from(msg))) {
            throw new Error("sent failed");
        }
        console.log(`sent ${sent}`);
        sent++;
    }, 500);
    if (sent > 100) {
        clearInterval(it);
        yield conn.close();
        process.exit(0);
    }
    console.log("OK");
}))();
