import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { formatDate, generateId, formatString } from "@/utils/util";
import ipc from "@/ipc";

window.packetNo = 0;

if(typeof acquireVsCodeApi === "function") {
  const vscode = acquireVsCodeApi();
  window.vscode = vscode;
  console.log("vscode", window.vscode);
}

function handleRealEntry(type, remote, packet, extra) {
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
  store.dispatch("addContact", contact);
}

function handleEntry(type, remote, packet, extra) {
  console.log('handleEntry', type, remote, packet, extra);
  handleRealEntry(type, remote, packet, extra);
  let nickname = (extra.nickname === undefined || extra.nickname==="") ? packet.user : extra.nickname;
  let content = formatString(store.state.nls.notificationOnlineText, nickname, remote.address);
  if(store.state.useVscodeMsg && window.vscode !== undefined) {
    window.vscode.postMessage({
      type: 'notify',
      title: `${store.state.nls.notificationOnlineTitle}`,
      content: content
    });
  } else {
    store.state.notifier.create({
      title: `${store.state.nls.notificationOnlineTitle}`,
      content: content,
      duration: 5000,
      closable: false     
    });
  }
}

function handleAnsentry(type, remote, packet, extra) {
  console.log('handleAnsentry', type, remote, packet, extra);
  handleRealEntry(type, remote, packet, extra);
}

function handleAbsence(type, remote, packet, extra) {
  console.log('handleAbsence', type, remote, packet, extra);
  let nickname = (extra.nickname === undefined || extra.nickname==="") ? packet.user : extra.nickname;
  let contact = {
    address: remote.address,
    port: remote.port,
    nickname: nickname,
    group: extra.group
  }
  store.dispatch("refreshContact", contact);
}

function handleExit(type, remote, packet, extra) {
  console.log('handleExit', type, remote, packet, extra);
  let contact = {
    address: remote.address,
    port: remote.port
  }
  let findContact = undefined;
  for(let item of store.state.contacts) {
    if(item.address === remote.address) {
      findContact = item;
      break;
    }
  }
  if(findContact != undefined) {
    if(store.state.useVscodeMsg && window.vscode !== undefined) {
      window.vscode.postMessage({
        type: 'notify',
        title: `${store.state.nls.notificationOfflineTitle}`,
        content: `${findContact.nickname} ${store.state.nls.notificationOfflineTitle}`
      });
    } else {
      store.state.notifier.create({
        title: `${store.state.nls.notificationOfflineTitle}`,
        content: `${findContact.nickname} ${store.state.nls.notificationOfflineTitle}`,
        duration: 5000,
        closable: false     
      });
    }
  }
  store.dispatch("removeContact", contact);
}

function handleMessage(type, remote, packet, extra, mine, read) {
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
  window.vscode.postMessage({
    type: 'log',
    content: JSON.stringify(message)
  });

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
      window.vscode.postMessage({
        type: 'notify',
        title: `${store.state.nls.notificationMsgTitle}`,
        content: content
      });
    } else {
      store.state.notifier.create({
        title: `${store.state.nls.notificationMsgTitle}`,
        content: content,
        duration: 5000,
        closable: false     
      });
    }
  }
}

function updateLog(message) {
  let address = message.remote.address;
  let port = message.remote.port;
  let findConversation = store.state.conversations.find(item => {
    if(item.address === address && item.port === port) {
      return true;
    }
    return false;
  });
  let findMessage = undefined;
  if(findConversation !== undefined) {
    console.log("updateLog findConversation", findConversation);
    for(let item of findConversation.messages) {
      if(message.packet.packetId === item.packet.packetId) {
        console.log("updateLog findMessage", item);
        findMessage = item;
        break;
      }
    }
  }
  if(findMessage !== undefined) {
    let strMessage = JSON.stringify(findMessage);
    let cloneMessage = JSON.parse(strMessage);

    for(let field of message.extra.fields) {
      cloneMessage.extra[field.name] = field.value;
    }
    if(cloneMessage.extra.status == 3 && message.extra.fileId !== undefined) {
      let fileId = message.extra.fileId;
      for(let file of cloneMessage.extra.files) {
        if(file.fileId === fileId) {
          file.accept = true;
          break;
        }
      }
    }
    ipc.updateLog(findMessage.messageId, findMessage.extra);
  }
}

function handleFromMain(message) {
  let obj = JSON.parse(message);
  let type = obj.type;
  let remote = obj.remote;
  let packet = obj.packet;
  let extra = obj.extra;
  console.log('handleFromMain', type, remote, packet, extra);
  switch(type) {
    case "entry": {
      handleEntry(type, remote, packet, extra);
    }
    break;
    case "absence": {
      handleAbsence(type, remote, packet, extra);
    }
    break;
    case "exit": {
      handleExit(type, remote, packet, extra);
    }
    break;
    case "ansentry": {
      handleAnsentry(type, remote, packet, extra);
    }
    break;
    case "text": {
      let read = false;
      if(store.state.chatWith !== undefined) {
        read = (store.state.chatWith.address === remote.address) ? true : false;
      }
      handleMessage(type, remote, packet, extra, false, read);
    }
    break;
    case "file": {
      let read = false;
      if(store.state.chatWith !== undefined) {
        read = (store.state.chatWith.address === remote.address) ? true : false;
      }
      handleMessage(type, remote, packet, extra, false, read);
    }
    break;
    case "myfile": {
      handleMessage("file", remote, packet, extra, true, true);
    }
    break;
    case "fileUpdate": {
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
    break;
  }
}

// Handle messages sent from the extension to the webview
window.addEventListener('message', event => {
  const data = event.data; // The json data that the extension sent
  switch (data.type) {
    case 'setTheme':
      const kind = data.kind;
      store.dispatch("setTheme", kind);
      break;
    case 'setIPList':
      const defaultIP = data.defaultIP;
      const ipList = data.ipList;
      store.dispatch("setIp", defaultIP);
      store.dispatch("setIpList", ipList);
      break;
    case 'setting':
      const mode = data.mode;
      const nickname = data.nickname;
      const group = data.group;
      const filelocation = data.filelocation;
      store.dispatch("setMode", mode);
      store.dispatch("setNickname", nickname);
      store.dispatch("setGroup", group);
      store.dispatch("setFilelocation", filelocation);
      break;
    case 'setNetworkList':
      const networkList = data.networkList;
      console.log("setNetworkList", networkList);
      store.dispatch("setNetworkList", networkList);
      break;
    case 'setFavoriteList':
      const favoriteList = data.favoriteList;
      console.log("setFavoriteList", favoriteList);
      store.dispatch("setFavoriteList", favoriteList);
      break;
    case 'setUseVscodeMsg':
      const useVscodeMsg = data.useVscodeMsg;
      console.log("setUseVscodeMsg", useVscodeMsg);
      store.dispatch("setUseVscodeMsg", useVscodeMsg);
      break;
    case 'setHisdays':
      const hisdays = data.hisdays;
      console.log("setHisdays", hisdays);
      store.dispatch("setHisdays", hisdays);
      break;
    case 'fromMain': {
      handleFromMain(data.message);
    }
    break;
    case "loadlog": {    
      let message = JSON.parse(data.content);  
      let obj = {
        pos: 0,
        message
      }
      store.dispatch("addMessage", obj);
      store.dispatch("increaseMessage");
    }
    break;
    case "locale": {
      let locale = "enUS";
      if(data.locale ==="zh-cn") {
        locale = "zhCN";
      }
      store.dispatch("setLocale", locale);
    }
    break;
    case "setEncryption": {
      const encryption = data.encryption;
      store.dispatch("setEncryption", encryption);
    }
    break;
    case "setUriRoot": {
      const uriRoot = data.uriRoot;
      store.dispatch("setUriRoot", uriRoot);
      const webRoot = data.webRoot;
      store.dispatch("setWebRoot", webRoot);
    }
    break;
  }
});

createApp(App).use(store).use(router)/*.use(naive)*/.mount("#app");
