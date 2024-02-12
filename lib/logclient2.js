"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogLevel = exports.LogClient2 = void 0;
const socket_io_client_1 = __importDefault(require("socket.io-client"));
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const os_1 = __importDefault(require("os"));
const VERBOSE = 1;
const AUTHENTICATION_DNS = 'auth.techserio.com';
const OAUTH_CLIENT = process.env.OAUTH_CLIENT || 'undefined_client';
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || 'invalid_client_secret';
const OAUTH_SCOPE = 'logging';
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["METRIC"] = 0] = "METRIC";
    LogLevel[LogLevel["DEBUG"] = 1] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 5] = "FATAL";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class LogClient2 {
    constructor(serviceName = null) {
        this.messageBuffer = [];
        this.connected = false;
        this.destroying = false;
        this.serviceName = serviceName;
        this.createSocketIO();
    }
    createSocketIO() {
        let httpProtocol = 'http';
        let logDNS = 'localhost:8084';
        if (process.env.NODE_ENV == 'production') {
            httpProtocol = 'https';
            logDNS = 'log.farsnap.link';
        }
        const socketio_uri = `${httpProtocol}://${logDNS}/`;
        console.log('connecting to logserv (socketio) at: ' + socketio_uri);
        this.io = (0, socket_io_client_1.default)(socketio_uri);
        this.io.on('connect', async () => {
            await this.onConnect();
        });
        this.io.on('registration', (data) => {
            if (data != 'OK') {
                this.connected = false;
                if (VERBOSE == 1) {
                    console.log('LogClient2.createSocketIO() - error while authenticating to log client');
                }
                return;
            }
            this.connected = true;
            if (VERBOSE == 1) {
                console.log('LogClient2.createSocketIO() - Authenticated');
            }
            for (let msg of this.messageBuffer) {
                this.io.emit('L', msg);
            }
            this.messageBuffer = [];
        });
        this.io.on('err', (err) => {
            if (VERBOSE == 1) {
                console.log(`LogClient2.createSocketIO() - on 'err' = ${err}`);
            }
        });
        this.io.on('disconnect', () => {
            this.onDisconnect();
        });
    }
    async onConnect() {
        if (VERBOSE == 1) {
            console.log('Connected to logserver ...');
        }
        let accessToken = '';
        try {
            accessToken = await this.getAccessToken();
        }
        catch (e) {
            console.log(`LogClient2.onConnect() - Unable to get access_token: err ${e}`);
            setTimeout(() => { this.io.disconnect(); }, 15000);
        }
        this.io.emit('registration', { "access_token": accessToken });
    }
    onDisconnect() {
        this.connected = false;
        if (this.destroying) {
            return;
        }
        if (VERBOSE == 1) {
            console.log('LogClient2.onDisconnect() - socket.io disconnect.');
            console.log('LogClient2.onDisconnect() - socket.io recreating.');
        }
        this.io.close();
        this.createSocketIO();
    }
    async getAccessToken() {
        const url = `https://${OAUTH_CLIENT}:${OAUTH_CLIENT_SECRET}@${AUTHENTICATION_DNS}/token`;
        const formData = new form_data_1.default();
        formData.append('grant_type', 'client_credentials');
        formData.append('scope', OAUTH_SCOPE);
        const response = await axios_1.default.post(url, formData, { headers: formData.getHeaders() });
        if (response.status !== 200) {
            const msg = `LogClient2.getAccessToken() - error err: ${response.statusText} status = ${response.status}`;
            console.log(msg);
            throw new Error(msg);
        }
        console.log('new token:');
        console.dir(JSON.stringify(response.data).substr(0, 40) + '...');
        return response.data.access_token;
    }
    /**
     * Creates a LogClient instance or returns an existing one.
     */
    static getInstance(name = null) {
        if (this.loggerInstance) {
            return this.loggerInstance;
        }
        else {
            this.loggerInstance = new this(name);
            return this.loggerInstance;
        }
    }
    /*
    async destroy() {
      this.destroying = true;
      this.io.disconnect();
    }
     */
    log(logLevel, username, machineName, serviceName, functionName, sessionID, metricName, metricValue, logMessage) {
        if ((!logMessage) && !((metricName) && (metricValue))) {
            console.log('LogClient2.log() - should contain either message or metric_name and metric_value');
        }
        if (!logLevel) {
            logLevel = LogLevel.DEBUG;
        }
        const logData = {
            "log_time": (new Date()).toISOString(),
            "log_level": LogLevel[logLevel],
            "username": username,
            "machine_name": machineName ? machineName : os_1.default.hostname(),
            "service_name": serviceName ? serviceName : this.serviceName ? this.serviceName : null,
            "function_name": functionName,
            "session_id": sessionID,
            "metric_name": metricName,
            "metric_value": metricValue,
            "log_message": logMessage
        };
        if (!this.connected) {
            console.log(`LogClient2.log() - logging to memory (no connection to log server): ${JSON.stringify(logData)}`);
            this.messageBuffer.push(logData);
            return;
        }
        for (let msg of this.messageBuffer) {
            this.io.emit('L', msg);
        }
        this.messageBuffer = [];
        this.io.emit('L', logData);
    }
    DEBUG(logMessage, functionName = null, sessionID = null, serviceName = null) {
        this.log(LogLevel.DEBUG, null, null, serviceName, functionName, sessionID, null, null, logMessage);
    }
    INFO(logMessage, functionName = null, sessionID = null, serviceName = null) {
        this.log(LogLevel.INFO, null, null, serviceName, functionName, sessionID, null, null, logMessage);
    }
    WARN(logMessage, functionName = null, sessionID = null, serviceName = null) {
        this.log(LogLevel.WARN, null, null, serviceName, functionName, sessionID, null, null, logMessage);
    }
    ERROR(logMessage, functionName = null, sessionID = null, serviceName = null) {
        this.log(LogLevel.ERROR, null, null, serviceName, functionName, sessionID, null, null, logMessage);
    }
    FATAL(logMessage, functionName = null, sessionID = null, serviceName = null) {
        this.log(LogLevel.FATAL, null, null, serviceName, functionName, sessionID, null, null, logMessage);
    }
    METRIC(metricName, metricValue, functionName = null, sessionID = null, serviceName = null) {
        this.log(LogLevel.METRIC, null, null, serviceName, functionName, sessionID, metricName, metricValue, null);
    }
}
exports.LogClient2 = LogClient2;
LogClient2.loggerInstance = null;
//# sourceMappingURL=logclient2.js.map