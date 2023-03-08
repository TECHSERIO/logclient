
import {LogClient2} from './logclient2';

// ###################################
//           DEPRECATED !!!
// ###################################

// let log = new LogClient('logdemo');

// ###################################
//          Use getInstance
// ###################################

let log = LogClient2.getInstance('logdemo');

// ###################################

let counter = 0;

function logMsg() {

  log.INFO(`log demo counter ${counter++}`);
  
  if (counter % 10 == 0) {
    log.ERROR(`ERROR: log demo counter ${counter++}`);
  }

  if (counter < 10) setTimeout(logMsg, 500);

}

logMsg();
