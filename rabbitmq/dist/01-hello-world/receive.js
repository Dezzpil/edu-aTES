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
const amqplib_1 = __importDefault(require("amqplib"));
const send_1 = require("./send");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const conn = yield amqplib_1.default.connect(send_1.dsn);
    const ch = yield conn.createChannel();
    yield ch.assertQueue(send_1.queue, { durable: false });
    yield ch.consume(send_1.queue, (msg) => {
        console.log(`got message: ${msg === null || msg === void 0 ? void 0 : msg.content}`);
    }, { noAck: true });
}))();
