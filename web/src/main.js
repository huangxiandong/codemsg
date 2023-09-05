import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { formatDate, generateId, formatString } from "@/utils/util";
import ipc from "@/ipc";
import { Boot } from '@wangeditor/editor'

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
    if(store.state.notifier !==undefined) {
      store.state.notifier.create({
        title: `${store.state.nls.notificationOnlineTitle}`,
        content: content,
        duration: 5000,
        closable: false     
      });  
    }
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
      if(store.state.notifier !==undefined) {
        store.state.notifier.create({
          title: `${store.state.nls.notificationOfflineTitle}`,
          content: `${findContact.nickname} ${store.state.nls.notificationOfflineTitle}`,
          duration: 5000,
          closable: false     
        });
      }
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
      if(store.state.notifier !==undefined) {
        store.state.notifier.create({
          title: `${store.state.nls.notificationMsgTitle}`,
          content: content,
          duration: 5000,
          closable: false     
        });
      }
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

class FileMenu {
  constructor() {
    if(store !== undefined && store.state !== undefined && store.state.nls !== undefined) {
      this.title = store.state.nls.chatSendFileTooltip;
    } else {
      this.title = "Send File"
    }
    this.iconSvg = '<svg t="1675407453129" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2721" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M888.494817 313.882803l-198.019982-198.019982c-7.992021-7.992021-20.957311-7.992021-28.949332 0s-7.992021 20.947078 0 28.939099l163.084309 163.084309-215.794811 0L608.814999 42.686195c0-11.307533-9.15859-20.466124-20.466124-20.466124l-408.094512 0c-11.307533 0-20.466124 9.15859-20.466124 20.466124l0 938.62761c0 11.2973 9.15859 20.466124 20.466124 20.466124l693.76067 0c11.307533 0 20.466124-9.168824 20.466124-20.466124l0-652.961452C894.481158 322.92883 892.332215 317.720202 888.494817 313.882803zM853.54891 960.847681l-652.828422 0L200.720488 63.152319l367.162264 0 0 265.200034c0 11.307533 9.168824 20.466124 20.466124 20.466124l265.200034 0L853.54891 960.847681z" p-id="2722"></path></svg>'
    this.tag = 'button'
  }
  getValue(editor) {
    return ' hello '
  }
  isActive(editor) {
    return false // or true
  }
  isDisabled(editor) {
    return false // or true
  }
  exec(editor, value) {
    if(editor.sendFileMethod !== undefined) {
      editor.sendFileMethod();
    }
  }
}

class FolderMenu {
  constructor() {
    if(store !== undefined && store.state !== undefined && store.state.nls !== undefined) {
      this.title = store.state.nls.chatSendFolderTooltip;
    } else {
      this.title = "Send Folder"
    }
    this.iconSvg = '<svg t="1675407786116" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5086" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M810.666667 85.333333a85.333333 85.333333 0 0 1 85.333333 85.333334v152.021333c36.821333 9.493333 64 42.88 64 82.645333v405.333334a128 128 0 0 1-128 128H192a128 128 0 0 1-128-128V298.666667a85.376 85.376 0 0 1 64-82.645334V170.666667a85.333333 85.333333 0 0 1 85.333333-85.333334h597.333334zM128.149333 296.170667L128 298.666667v512a64 64 0 0 0 60.245333 63.893333L192 874.666667h640a64 64 0 0 0 63.893333-60.245334L896 810.666667V405.333333a21.333333 21.333333 0 0 0-18.837333-21.184L874.666667 384H638.165333l-122.069333-101.717333a21.333333 21.333333 0 0 0-10.688-4.736l-2.986667-0.213334H149.333333a21.333333 21.333333 0 0 0-21.184 18.837334zM535.189333 213.333333l127.978667 106.666667H832V170.666667a21.333333 21.333333 0 0 0-18.837333-21.184L810.666667 149.333333H213.333333a21.333333 21.333333 0 0 0-21.184 18.837334L192 170.666667v42.666666h343.168z" fill="#333333" p-id="5087"></path></svg>'
    this.tag = 'button'
  }
  getValue(editor) {
    return ' hello '
  }
  isActive(editor) {
    return false // or true
  }
  isDisabled(editor) {
    return false // or true
  }
  exec(editor, value) {
    if(editor.sendFolderMethod !== undefined) {
      editor.sendFolderMethod();
    }
  }
}

class VideoMenu {
  constructor() {
    this.title = "视频通话"
    this.iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 28 28"><g fill="none"><path d="M5.25 5.5A3.25 3.25 0 0 0 2 8.75v10.5a3.25 3.25 0 0 0 3.25 3.25h10.502a3.25 3.25 0 0 0 3.25-3.25v-1.58l4.541 3.112a1.25 1.25 0 0 0 1.957-1.03V8.247a1.25 1.25 0 0 0-1.956-1.03l-4.542 3.11V8.75a3.25 3.25 0 0 0-3.25-3.25H5.25zm13.752 10.352v-3.707L24 8.723v10.554l-4.998-3.425zm-1.5-7.102v10.5a1.75 1.75 0 0 1-1.75 1.75H5.25a1.75 1.75 0 0 1-1.75-1.75V8.75C3.5 7.784 4.284 7 5.25 7h10.502c.967 0 1.75.784 1.75 1.75z" fill="currentColor"></path></g></svg>';
    this.tag = 'button'
  }
  getValue(editor) {
    return ' hello '
  }
  isActive(editor) {
    return false // or true
  }
  isDisabled(editor) {
    return false // or true
  }
  exec(editor, value) {
    if(editor.videoCallMethod !== undefined) {
      editor.videoCallMethod();
    }
  }
}

const fileMenuConf = {
  key: 'fileMenu',
  factory() {
    return new FileMenu()
  }
}
const folderMenuConf = {
  key: 'folderMenu',
  factory() {
    return new FolderMenu()
  }
}
const videoMenuConf = {
  key: 'videoMenu',
  factory() {
    return new VideoMenu()
  }
}
Boot.registerMenu(fileMenuConf)
Boot.registerMenu(folderMenuConf)
// Boot.registerMenu(videoMenuConf)

import { DomEditor } from '@wangeditor/editor'

function ctrlEnter(editor) {                            // JS 语法
  const { insertBreak } = editor // 获取当前 editor API
  const newEditor = editor

  setTimeout(() => {
    // beforeInput 事件不能识别 ctrl+enter ，所以自己绑定 DOM 事件
    const { $textArea } = DomEditor.getTextarea(newEditor)
    if ($textArea == null) return
    $textArea.on('keydown', e => {
      const event = e
      const isCtrl = event.ctrlKey || event.metaKey
      if (event.key === 'Enter' && isCtrl) {
        // ctrl+enter 触发换行
        newEditor.insertBreak()
      }
    })
  })

  newEditor.insertBreak = () => {
    console.log("insertBreak")
    const event = window.event
    const isCtrl = event.ctrlKey || event.metaKey
    // 只有 ctrl 才能换行
    if (isCtrl) {
      insertBreak()
    } else {
      if(newEditor.customBreak !== undefined) {
        newEditor.customBreak();
      }
    }
  }
  // 返回 newEditor ，重要！
  return newEditor
}

Boot.registerPlugin(ctrlEnter)