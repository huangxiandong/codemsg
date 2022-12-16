export default {
  entry: function() {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'entry'
      });
    }
  },
  reentry: function(remote) {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'reentry',
        remote
      });
    }
  },
  sendMsg: function(contact, message) {
    if(window.vscode !== undefined) {
      console.log("contact", contact);
      window.vscode.postMessage({
        type: 'sendMsg',
        contact: JSON.stringify(contact),
        message: message
      });
    }
  },
  sendFile: function(contact) {
    if(window.vscode !== undefined) {
      console.log("contact", contact);
      window.vscode.postMessage({
        type: 'sendFile',
        contact: contact
      });
    }
  },
  
  openFile: function(message) {
    if(window.vscode !== undefined) {
      console.log("openFile", message);
      window.vscode.postMessage({
        type: 'openFile',
        filename: message.filename,
        location: message.location
      });
    }
  },
  openFolder: function(message) {
    if(window.vscode !== undefined) {
      console.log("openFolder", message);
      window.vscode.postMessage({
        type: 'openFolder',
        filename: message.filename,
        location: message.location
      });
    }
  },

  setting: function(mode, nickname, group, filelocation) {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'setting',
        mode: mode,
        nickname: nickname,
        group: group,
        filelocation: filelocation
      });
    }
  },
  setNetworkList: function(networkList) {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'setNetworkList',
        items: JSON.stringify(networkList)
      });
    }
  },
  setUseVscodeMsg: function(useVscodeMsg) {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'setUseVscodeMsg',
        useVscodeMsg: useVscodeMsg
      });
    }
  },
  setHisdays: function(hisdays) {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'setHisdays',
        hisdays: hisdays
      });
    }
  },
  addFavorite: function(address) {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'addFavorite',
        address: address
      });
    }
  },
  removeFavorite: function(address) {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'removeFavorite',
        address: address
      });
    }
  },
  postMainMessage: function(data) {
    if(window.vscode !== undefined) {
      let str = JSON.stringify(data);
      console.log("postMainMessage", str);
      window.vscode.postMessage({
        type: 'fromWebview',
        data: str
      });
    }
  },
  log: function(message) {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'log',
        content: JSON.stringify(message)
      });
    }
  },
  loadHistory: function() {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'loadHistory'
      });
    }
  },
  updateLog: function(messageId, extra) {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'updateLog',
        messageId,
        extra: JSON.stringify(extra)
      });
    }
  },
  setEncryption: function(encryption) {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'setEncryption',
        encryption: encryption
      });
    }
  },
  changeIp: function(ip) {
    if(window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'changeIp',
        ip: ip
      });
    }
  }
}