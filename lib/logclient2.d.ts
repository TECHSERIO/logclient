declare enum LogLevel {
    METRIC = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5
}
declare class LogClient2 {
    private messageBuffer;
    private connected;
    private destroying;
    private readonly serviceName;
    private io;
    constructor(serviceName?: string);
    private createSocketIO;
    private onConnect;
    private onDisconnect;
    private getAccessToken;
    private static loggerInstance;
    /**
     * Creates a LogClient instance or returns an existing one.
     */
    static getInstance(name?: string): LogClient2;
    log(logLevel: LogLevel, username: string, machineName: string, serviceName: string, functionName: string, sessionID: string, metricName: string, metricValue: number, logMessage: string): void;
    DEBUG(logMessage: string, functionName?: string, sessionID?: string, serviceName?: string): void;
    INFO(logMessage: string, functionName?: string, sessionID?: string, serviceName?: string): void;
    WARN(logMessage: string, functionName?: string, sessionID?: string, serviceName?: string): void;
    ERROR(logMessage: string, functionName?: string, sessionID?: string, serviceName?: string): void;
    FATAL(logMessage: string, functionName?: string, sessionID?: string, serviceName?: string): void;
    METRIC(metricName: string, metricValue: number, functionName?: string, sessionID?: string, serviceName?: string): void;
}
export { LogClient2, LogLevel };
