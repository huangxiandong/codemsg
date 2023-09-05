const callbackFn = {};

function vscodePlatform () {
  if (window.vscode === undefined) {
    if (typeof acquireVsCodeApi === 'function') {
      // vscode 
      const vscode = acquireVsCodeApi();
      window.vscode = vscode;
      return vscode;
    } else {
      return undefined;
    }
  }
}

export function callVscode(type, data, callback) {  
  vscodePlatform();
  if (window.vscode !== undefined) {
    const cbid = Date.now() + '' + Math.round(Math.random() * 100000);
    if(callback) {
      callbackFn[cbid] = callback;
    }
    window.vscode.postMessage({
      type: type,
      data,
      cbid
    });
  }
}


const handlers = {};

export function listenToVscode(config) {
  window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    console.log("receive vscode messsage:", message)
    const cbid = message.cbid;
    if(cbid) {
      let handler = window.callbackFn[cbid];
      if(handler) {
        handler(message.data);
        delete window.callbackFn[cbid];
      } else {
        throw new Error(`找不到${message.type}的回调函数`);
      }
    } else {
      const type = message.type;
      if(type) {
        if(handlers[type]) {
          handlers[type](config);
        } else {
          console.log('listenToVscode', `the handler of message [${type}] not found.`)
        }
      } else {
        console.log('listenToVscode', 'unknown message type.')
      }
    }
  });  
}