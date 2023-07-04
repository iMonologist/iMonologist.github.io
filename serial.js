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
var Serial = navigator.serial;
var toWriteText;
var fromSerialText;
class LineBreakTransformer {
    constructor() {
        this.container = '';
        this.container = '';
    }
    transform(chunk, controller) {
        this.container += chunk;
        const lines = this.container.split('\r\n');
        this.container = lines.pop();
        lines.forEach(line => controller.enqueue(line));
    }
    flush(controller) {
        controller.enqueue(this.container);
    }
}
class SerialPortManagerClass {
    constructor() {
        this.serials = new Map();
    }
    getSerial(port, force = false) {
        if (this.serials.has(port)) {
            return this.serials.get(port);
        }
        else {
            if (force) {
                const serial = new SerialPort();
                serial.port = port;
                serial.manager = this;
                this.serials.set(port, serial);
                return serial;
            }
            return null;
        }
    }
    onGetDevices(ports) {
        this.ports = ports;
        ports.forEach((port, index) => console.log(index, ":", port.getInfo()));
    }
    queryDevices() {
        var e = this;
        navigator.serial.getPorts().then((ports) => {
            e.ports = ports;
            ports.forEach((port, index) => this.getSerial(port, true));
            console.log(ports, this.serials);
        });
        console.log('queryDevices');
    }
    onConnect(e) {
    }
    onDisconnect(e) {
    }
    prepare() {
        Serial.addEventListener("connect", this.onConnect.bind(this));
        Serial.addEventListener("disconnect", this.onConnect.bind(this));
    }
    connectSerial() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const port = yield Serial.requestPort();
                var asp = this.getSerial(port);
                if (!asp)
                    asp = this.getSerial(port, true);
                this.current = asp;
                if (!asp.connected)
                    asp.connect();
            }
            catch (_a) {
                alert("Serial Connection Failed");
            }
        });
    }
    disConnectAll() {
        for (let kv of this.serials) {
            kv[1].disConnect();
        }
        this.current = null;
        this.ports.length = 0;
        this.serials.clear();
    }
}
const SerialPortManager = new SerialPortManagerClass();
class SerialPort {
    constructor() {
        this.options = { baudRate: 115200 };
        this.encoder = new TextEncoder();
    }
    get connected() {
        return this.reader != null;
    }
    onLineReceived(line) {
        console.log('.', line);
    }
    write(line) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('_', line);
            yield this.writer.write(this.encoder.encode(line + '\n'));
        });
    }
    connect() {
        console.log('Connecting to serial port');
        this.port.open(this.options).then(this.onConnect.bind(this), (e) => console.log(e));
    }
    disConnect(force = true) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('disconnecting serial');
            if (this.reader) {
                this.reader.cancel();
                yield this.readerStreamDone.catch(() => { });
                this.reader = null;
                this.readerStreamDone = null;
            }
            if (this.writer) {
                this.writer.releaseLock();
                yield this.port.writable.close();
                this.writer = null;
            }
            if (this.port.readable) {
                yield this.port.close();
                this.onDisconnect();
            }
        });
    }
    onConnect() {
        console.info('Connected to serial port');
        this.writer = this.port.writable.getWriter();
        this.listenToPort();
    }
    listenToPort() {
        return __awaiter(this, void 0, void 0, function* () {
            console.info('listening to serial port');
            this.decoder = new TextDecoderStream();
            this.readerStreamDone = this.port.readable.pipeTo(this.decoder.writable);
            this.readerStream = this.decoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer()));
            this.reader = this.readerStream.getReader();
            while (true) {
                const { value, done } = yield this.reader.read();
                if (done) {
                    this.reader.releaseLock();
                    break;
                }
                if (value)
                    this.onLineReceived(value);
            }
        });
    }
    onDisconnect() {
        console.log("Disconnected from the serial port");
    }
}
var prepared = false;
function prepare() {
    if (!prepared) {
        toWriteText = document.getElementById('toWriteText');
        fromSerialText = document.getElementById('fromSerialText');
        prepared = true;
    }
}
function connectSerial() {
    prepare();
    SerialPortManager.connectSerial();
}
function getPorts() {
    prepare();
    SerialPortManager.queryDevices();
}
function send() {
    prepare();
    if (SerialPortManager.current)
        SerialPortManager.current.write(toWriteText.value);
}
function closeSerial() {
    prepare();
    if (SerialPortManager.current)
        SerialPortManager.current.disConnect();
}
function disConnectAll() {
    SerialPortManager.disConnectAll();
    return;
    navigator.serial.getPorts().then((ports) => {
        for (let i = 0; i < ports.length; i++) {
            console.log(i, ":", ports[i].getInfo());
            ports[i].close();
        }
        console.log(ports);
    });
}
