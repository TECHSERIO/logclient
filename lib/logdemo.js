"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logclient2_1 = require("./logclient2");
// ###################################
//           DEPRECATED !!!
// ###################################
// let log = new LogClient('logdemo');
// ###################################
//          Use getInstance
// ###################################
let log = logclient2_1.LogClient2.getInstance('logdemo');
// ###################################
let counter = 0;
function logMsg() {
    log.INFO(`log demo counter ${counter++}`);
    if (counter % 10 == 0) {
        log.ERROR(`ERROR: log demo counter ${counter++}`);
    }
    if (counter < 10)
        setTimeout(logMsg, 500);
}
logMsg();
//# sourceMappingURL=logdemo.js.map