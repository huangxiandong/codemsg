import { formatDate, generateId, formatString } from "@/utils/util";

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

export const ipc = {
  webReady: function() {
    callVscode('webReady', {})
  },
  entry: function() {
    callVscode('entry', {})
  },
  
  reentry: function(remote) {
    callVscode('reentry', {
      remote
    })
  },
  
  sendMsg: function(contact, message) {
    callVscode('sendMsg', {
      contact: JSON.stringify(contact),
      message: message
    })
  },
  
  sendFile: function(contact) {
    callVscode('sendFile', {
      contact: contact
    })
  },
  
  openFile: function(message) {
    callVscode('openFile', {
      filepath: message.filepath
    })
  },
  
  openFolder(message) {
    callVscode('openFolder', {
      filepath: message.filepath
    })
  },
  
  setting: function(mode, nickname, group, filelocation) {
    callVscode('setting', {
      mode: mode,
      nickname: nickname,
      group: group,
      filelocation: filelocation
    })
  },
  
  setNetworkList: function(networkList) {
    callVscode('setNetworkList', {
      items: JSON.stringify(networkList)
    })
  },
  
  setUseVscodeMsg: function(useVscodeMsg) {
    callVscode('setUseVscodeMsg', {
      useVscodeMsg: useVscodeMsg
    })
  },
  
  setHisdays: function(hisdays) {
    callVscode('setHisdays', {
      hisdays: hisdays
    })
  },
  
  addFavorite: function(address) {
    callVscode('addFavorite', {
      address: address
    })
  },
  
  removeFavorite: function(address) {
    callVscode('removeFavorite', {
      address: address
    })
  },
  
  postMainMessage(data) {
    callVscode('fromWebview', {
      data: JSON.stringify(data)
    })
  },
  
  log: function(message) {
    callVscode('log', {
      content: JSON.stringify(message)
    })
  },
  
  loadHistory: function() {
    callVscode('loadHistory', {})
  },
  
  updateLog: function(messageId, extra) {
    callVscode('updateLog', {
      messageId,
      extra: JSON.stringify(extra)
    })
  },
  
  setEncryption: function(encryption) {
    callVscode('setEncryption', {
      encryption
    })
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'setEncryption',
        encryption: encryption
      });
    }
  },
  
  changeIp: function(ip) {
    callVscode('changeIp', {
      ip
    })
  }  
}

function notify(store, title, content) {
  if(store.state.notifier !==undefined) {
    store.state.notifier.create({
      title,
      content,
      duration: 5000,
      closable: false     
    });  
  }
}

function handleRealEntry(remote, packet, extra) {
  let nickname = (extra.nickname === undefined || extra.nickname==="") ? packet.user : extra.nickname;
  let feiq = false;
  if(packet.version.indexOf("#") != -1) {
    feiq = true;
  }
  let myself = false;
  if(extra.myself !== undefined) {
    myself = extra.myself;
  }
  let contact = {
    user: packet.user,
    host: packet.host,
    address: remote.address,
    port: remote.port,
    nickname: nickname,
    group: extra.group,
    client: extra.client,
    feiq,
    myself
  }
  const store = config.store;
  store.dispatch("addContact", contact);
}

function onEntry(data, config) {
  let remote = data.remote;
  let packet = data.packet;
  let extra = data.extra;
  console.log('onEntry', remote, packet, extra);
  handleRealEntry(remote, packet, extra);
  let nickname = (extra.nickname === undefined || extra.nickname==="") ? packet.user : extra.nickname;

  const store = config.store;
  let content = formatString(store.state.nls.notificationOnlineText, nickname, remote.address);
  if(store.state.useVscodeMsg && window.vscode !== undefined) {
    callVscode('notify', {
      title: `${store.state.nls.notificationOnlineTitle}`,
      content: content
    });
  } else {
    notify(store, `${store.state.nls.notificationOnlineTitle}`, content);
  }
}

function onAnsentry(data, config) {
  let remote = data.remote;
  let packet = data.packet;
  let extra = data.extra;
  console.log('onAnsentry', remote, packet, extra);
  handleRealEntry(remote, packet, extra);
}

function onAbsence(data, config) {
  let remote = data.remote;
  let packet = data.packet;
  let extra = data.extra;
  console.log('onAbsence', remote, packet, extra);
  let nickname = (extra.nickname === undefined || extra.nickname==="") ? packet.user : extra.nickname;
  let contact = {
    address: remote.address,
    port: remote.port,
    nickname: nickname,
    group: extra.group
  }
  const store = config.store;
  store.dispatch("refreshContact", contact);
}

function onExit(data, config) {
  let remote = data.remote;
  let packet = data.packet;
  let extra = data.extra;
  console.log('onExit', remote, packet, extra);
  let contact = {
    address: remote.address,
    port: remote.port
  }
  const store = config.store;
  let findContact = undefined;
  for(let item of store.state.contacts) {
    if(item.address === remote.address) {
      findContact = item;
      break;
    }
  }
  if(findContact != undefined) {
    if(store.state.useVscodeMsg && window.vscode !== undefined) {
      callVscode('notify', {
        title: `${store.state.nls.notificationOfflineTitle}`,
        content: `${findContact.nickname} ${store.state.nls.notificationOfflineTitle}`
      });
    } else {
      if(store.state.notifier !==undefined) {
        notify(`${store.state.nls.notificationOfflineTitle}`, 
            `${findContact.nickname} ${store.state.nls.notificationOfflineTitle}`);
      }
    }
  }
  store.dispatch("removeContact", contact);
}

function handleMessage(type, remote, packet, extra, mine, read, store) {
  console.log('handleMessage', type, remote, packet, extra);
  let messageId = generateId() + "";
  let now = new Date();
  let dateStr = formatDate(now, "yyyy-MM-dd HH:mm:ss");
  
  let address = remote.address;
  let port = remote.port;
  let findContact = store.state.contacts.find(item => {
    if(item.address === address && item.port === port) {
      return true;
    }
    return false;
  });
  console.log("handleMessage", findContact);
  let nickname = "unknown";
  let group = "";
  if(findContact !== undefined) {
    nickname = findContact.nickname;
    group = findContact.group;
  } else {
    //如果收到消息但是不在联系人中，可能是电脑休眠之类的，需要定向重发BR_ENTRY
    ipc.reentry(remote);
  }
  let message = {
    messageId: messageId,
    order: now.getTime(),
    info: {
      type: type,
      mine: mine,
      read: read,
      date: dateStr
    },
    remote: {
      ...remote,
      nickname,
      group
    },
    packet,
    extra
  };
  let obj = {
    pos: -1,
    message,
  }
  store.dispatch("addMessage", obj);
  store.dispatch("increaseMessage");
  callVscode('log', {
    content: JSON.stringify(message)
  })

  if(!mine && ( store.state.currentView != "conversation"
    || store.state.chatWith === undefined 
    || store.state.chatWith.address !== remote.address)) {
  // const notification = useNotification();
    let findContact = undefined;
    for(let item of store.state.contacts) {
      if(item.address === remote.address) {
        findContact = item;
        break;
      }
    }
    let user = remote.address;
    if(findContact !== undefined) {
      user = findContact.nickname;
    }
    let content = formatString(store.state.nls.notificationMsgText, user);
    if(store.state.useVscodeMsg && window.vscode !== undefined) {
      callVscode('notify', {
        title: `${store.state.nls.notificationMsgTitle}`,
        content
      });
    } else {
      if(store.state.notifier !==undefined) {
        notify(`${store.state.nls.notificationMsgTitle}`, content);
      }
    }
  }
}

function onTextMessage(data, config) {
  let remote = data.remote;
  let packet = data.packet;
  let extra = data.extra;
  let read = false;
  const store = config.store;
  if(store.state.chatWith !== undefined) {
    read = (store.state.chatWith.address === remote.address) ? true : false;
  }
  handleMessage('text', remote, packet, extra, false, read,  store);
}

function onPeerFileMessage(data, config) {
  let remote = data.remote;
  let packet = data.packet;
  let extra = data.extra;
  let read = false;
  const store = config.store;
  if(store.state.chatWith !== undefined) {
    read = (store.state.chatWith.address === remote.address) ? true : false;
  }
  handleMessage('file', remote, packet, extra, false, read,  store);
}

function onSelfFileMessage(data, config) {
  let remote = data.remote;
  let packet = data.packet;
  let extra = data.extra;
  const store = config.store;
  handleMessage("file", remote, packet, extra, true, true, store);
}

function onFileUpdate(data, config) {
  let remote = data.remote;
  let packet = data.packet;
  let extra = data.extra;
  const store = config.store;
  store.dispatch("fileUpdate", {
    remote, 
    packet, 
    extra
  });
  updateLog({
    remote, 
    packet, 
    extra
  })
}

const handlers = {
  entry:onEntry,
  exit: onExit,
  absence: onAbsence,
  ansentry: onAnsentry,
  text: onTextMessage,
  file: onPeerFileMessage,
  myfile: onSelfFileMessage,
  fileUpdate: onFileUpdate
};

export function listenToVscode(config) {
  window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    console.log("receive vscode messsage:", message)
    const cbid = message.cbid;
    if(cbid) {
      let handler = callbackFn[cbid];
      if(handler) {
        handler(message.data);
        delete callbackFn[cbid];
      } else {
        throw new Error(`找不到${message.type}的回调函数`);
      }
    } else {
      const type = message.type;
      if(type) {
        if(handlers[type]) {
          handlers[type](message.data, config);
        } else {
          console.log('listenToVscode', `the handler of message [${type}] not found.`)
        }
      } else {
        console.log('listenToVscode', 'unknown message type.')
      }
    }
  });  
}