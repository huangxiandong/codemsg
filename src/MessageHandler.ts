import * as fs from 'fs';
import * as path from 'path';
import * as os from "os";
import * as vscode from 'vscode';
import { IPMsg } from './ipmsg/IPMsg'
import { WebviewMessage } from "./ipmsg/WebviewMessage";

function handleRecvFile(remote: any, packet: any, extra: any, webview: vscode.Webview) {
  const options: vscode.OpenDialogOptions = {
    canSelectFolders: true,
    filters: {
     'All files': ['*']
    }
  };
  vscode.window.showOpenDialog(options).then(fileUrl => {
    if(fileUrl != undefined) {
      console.log("handleRecvFile", fileUrl);
      IPMsg.instance().recvFiles(remote, packet, extra, fileUrl[0].fsPath);

      let message = new WebviewMessage("fileUpdate", {
        address: remote.address,
        port: remote.port
      },{
        packetId: packet.packetId,
      },{
        fileId: extra.files[0].fileId,
        fields: [{
          name: "status",
          value: 2,
        },{
          name: "location",
          value: fileUrl[0].fsPath
        }]
      });
      webview.postMessage({
        type: 'fromMain',
        data: {
          message: message.toString()
        }
      });
    }
  })
}

function handleSendFile(remote: any, packet: any, webview: vscode.Webview, folder: boolean) {
  const options: vscode.OpenDialogOptions = {
    canSelectMany: true,
    canSelectFolders: folder,
    openLabel: 'Open',
    filters: {
     'All files': ['*']
    }
  };

  vscode.window.showOpenDialog(options).then(fileUri => {
    if (fileUri) {
      console.log('Selected file: ' + fileUri);
      let files = [];
      let fileId = 1;
      for(let fu of fileUri) {
        let filepath = fu.fsPath;
        let fi = fs.statSync(filepath);
        let isFolder = fi.isDirectory();
        let tempPath = filepath.replace(/\\/g, "/");
        let index = tempPath.lastIndexOf("/");
        let fileName = filepath;
        if(index  != -1) {
          fileName = filepath.substring(index+1);
        }
        files.push({
          fileId: fileId,
          name: fileName,
          path: filepath,
          size: fi.size,
          type: isFolder?1:0,
          accept: false,
          status: 1
        });
        fileId++;
      }
      let extra = {
        files
      }
    
      IPMsg.instance().sendFile(remote, packet, extra);	
      let message = new WebviewMessage("myfile", 
      {
        address: remote.address,
        port: remote.port
      },{
        packetId: packet.packetId
      },{
        files: files,
        status: 1, //1.ready, 2.processing, 3.finish, 4.reject
        progress: 0,
        location: fileUri[0].fsPath
      });

      webview.postMessage({
        type: 'fromMain',
        data: {
          message: message.toString()
        }
      });
    }
  });
}

function handleDropFile(remote: any, packet: any, extra: any, webview: vscode.Webview) {
  let paths = extra.paths;
  console.log('Selected file: ' + paths);
  let files = [];
  let fileId = 1;
  for(let path of paths) {
    let filepath = path;
    let fi = fs.statSync(filepath);
    let isFolder = fi.isDirectory();
    let tempPath = filepath.replace(/\\/g, "/");
    let index = tempPath.lastIndexOf("/");
    let fileName = filepath;
    if(index  != -1) {
      fileName = filepath.substring(index+1);
    }
    files.push({
      fileId: fileId,
      name: fileName,
      path: filepath,
      size: fi.size,
      type: isFolder?1:0,
      accept: false,
      status: 1
    });
    fileId++;
  }
  let extra1 = {
    files
  }

  IPMsg.instance().sendFile(remote, packet, extra1);	
  let message = new WebviewMessage("myfile", 
  {
    address: remote.address,
    port: remote.port
  },{
    packetId: packet.packetId
  },{
    files: files,
    status: 1, //1.ready, 2.processing, 3.finish, 4.reject
    progress: 0,
  });

  webview.postMessage({
    type: 'fromMain',
    data: {
      message: message.toString()
    }
  });
}

function handleWebviewMessage(obj: any, webview: vscode.Webview) {
  switch(obj.info.type) {
    case "sendMsg": {
      IPMsg.instance().sendMsg(obj.remote, obj.extra);	
    }
    break;
    case "recvFile": {
      handleRecvFile(obj.remote, obj.packet, obj.extra, webview);
    }
    break;
    case "rejectFile": {
      IPMsg.instance().rejectFile(obj.remote, obj.packet);
    }
    break;
    case "sendFile": {
      handleSendFile(obj.remote, obj.packet, webview, false);
    }
    break;
    case "sendFolder": {
      handleSendFile(obj.remote, obj.packet, webview, true);
    }
    break;
    case "dropFile": {
      handleDropFile(obj.remote, obj.packet, obj.extra, webview);
    }
  }
}

const handleMessage = function(e: any, webview: vscode.Webview, webviewPanel: vscode.WebviewPanel, logDBs: any) {
  const web = e.data;
  switch (e.type) {
    case 'entry': {
      let mode = "FeiQ";
      let nickname = "";
      let group = "";
      let home = "";
      let encrypt = true;
      const mymode = vscode.workspace.getConfiguration().get('codemsg.mode');
      const myname = vscode.workspace.getConfiguration().get('codemsg.nickname');
      const mygroup = vscode.workspace.getConfiguration().get('codemsg.group');
      const myhome = vscode.workspace.getConfiguration().get('codemsg.filelocation');
      const myencrypt = vscode.workspace.getConfiguration().get('codemsg.encryption');
      if(typeof mymode === "string") {
        mode = mymode;
      }
      if(typeof myname === "string") {
        nickname = myname;
      }
      if(typeof mygroup === "string") {
        group = mygroup;
      }
      if(typeof myhome === "string") {
        home = myhome;
      }
      if(typeof myencrypt === "boolean") {
        encrypt = myencrypt;
      }
      const networkList = vscode.workspace.getConfiguration().get('codemsg.networkList');
      let setting = {
        mode,
        nickname,
        group,
        home,
        networkList,
        encrypt
      }
      IPMsg.instance().entry(setting);
    }
    break;
    case 'reentry': {
      let mode = "FeiQ";
      let nickname = "";
      let group = "";
      const mymode = vscode.workspace.getConfiguration().get('codemsg.mode');
      const myname = vscode.workspace.getConfiguration().get('codemsg.nickname');
      const mygroup = vscode.workspace.getConfiguration().get('codemsg.group');
      if(typeof mymode === "string") {
        mode = mymode;
      }
      if(typeof myname === "string") {
        nickname = myname;
      }
      if(typeof mygroup === "string") {
        group = mygroup;
      }
      let setting = {
        mode,
        nickname,
        group
      }
      IPMsg.instance().reentry(e.remote, setting);
    }
    break;	
    case 'setting':
      let mode = web.mode;
      let nickname = web.nickname;
      let group = web.group;
      let filelocation = web.filelocation;
      let target = vscode.ConfigurationTarget.Global;
      vscode.workspace.getConfiguration().update('codemsg.mode', mode, target);
      vscode.workspace.getConfiguration().update('codemsg.nickname', nickname, target);
      vscode.workspace.getConfiguration().update('codemsg.group', group, target);
      vscode.workspace.getConfiguration().update('codemsg.filelocation', filelocation, target);
      IPMsg.instance().absence(mode, nickname, group);
      break;
    case 'setNetworkList': {
      let items = JSON.parse(e.items);
      console.log("handleMessage setNetworkList", items);
      let target = vscode.ConfigurationTarget.Global;
      vscode.workspace.getConfiguration().update('codemsg.networkList', items, target);
      
      let nickname = "";
      let group = "";
      let home = "";
      const myname = vscode.workspace.getConfiguration().get('codemsg.nickname');
      const mygroup = vscode.workspace.getConfiguration().get('codemsg.group');
      const myhome = vscode.workspace.getConfiguration().get('codemsg.filelocation');
      if(typeof myname === "string") {
        nickname = myname;
      }
      if(typeof mygroup === "string") {
        group = mygroup;
      }
      if(typeof myhome === "string") {
        home = myhome;
      }
      let setting = {
        nickname,
        group,
        home,
        networkList:items
      }
      IPMsg.instance().entry(setting);
    }
    break;
    case 'addFavorite' : {
      let address = web.address;
      let target = vscode.ConfigurationTarget.Global;
      let favoriteList = vscode.workspace.getConfiguration().get('codemsg.favoriteList');
      if(favoriteList instanceof Array) {
        favoriteList.push(address);
        vscode.workspace.getConfiguration().update('codemsg.favoriteList', favoriteList, target);
      }
    }
    break;
    case 'removeFavorite' : {
      let address = web.address;
      let target = vscode.ConfigurationTarget.Global;
      let favoriteList = vscode.workspace.getConfiguration().get('codemsg.favoriteList');
      if(favoriteList instanceof Array) {
        let index = favoriteList.indexOf(address);
        if(index != -1) {
          favoriteList.splice(index, 1);
          vscode.workspace.getConfiguration().update('codemsg.favoriteList', favoriteList, target);
        }
      }      
    }
    break;
    case 'setUseVscodeMsg' : {
      let target = vscode.ConfigurationTarget.Global;
      let useVscodeMsg = web.useVscodeMsg;
      vscode.workspace.getConfiguration().update('codemsg.useVscodeMsg', useVscodeMsg, target);
    }
    break;
    case 'setHisdays' : {
      let target = vscode.ConfigurationTarget.Global;
      let hisdays = web.hisdays;
      vscode.workspace.getConfiguration().update('codemsg.hisdays', hisdays, target);
    }
    break;
    case 'notify' : {
      let title = web.title;
      let content = web.content;
      vscode.window.showInformationMessage(title, content);
      // if(webviewPanel.active) {
      //   webviewPanel.title = `CodeMsg - you have new messages`;
      // } else {
      //   webviewPanel.title = `CodeMsg`;
      // }
    }
    break;
    case 'openFile': {
      let filepath = web.filepath;
      let fileuri = vscode.Uri.file(filepath);
      vscode.commands.executeCommand("vscode.open", fileuri);
    }
    break;
    case 'openFolder': {
      let filepath = web.filepath;
      let fileuri = vscode.Uri.file(filepath);
      vscode.commands.executeCommand("revealFileInOS", fileuri);
    }
    break;
    case 'fromWebview': {
      let data = web.data;
      let obj = JSON.parse(data);
      handleWebviewMessage(obj, webview);
    }
    break;
    case 'log' : {
      let content = JSON.parse(web.content);
      console.log("log", content);
      let todayDB = logDBs.today;
      todayDB.insert(
        content,
        (err:any, ret:any) => {
          console.log("save log");
      });
    }
    break;
    case "loadHistory": {
      console.log("loadHistory");
      let todayDB = logDBs.today;
      todayDB.find({}).sort({ order: -1 }).exec(function (err:any, docs:any) {
        for(let item of docs) {
          console.log("loadHistory", item);
          webviewPanel.webview.postMessage({
            type: 'loadlog',
            data: {
              content: JSON.stringify(item)
            }
          });
        }
      });
      let hisDBs = logDBs.history;
      for(let hisDB of hisDBs) {
        hisDB.find({}).sort({ order: -1 }).exec(function (err:any, docs:any) {
          for(let item of docs) {
            webviewPanel.webview.postMessage({
              type: 'loadlog',
              data: {
                content: JSON.stringify(item)
              }
            });
          }
        });
      }
    }
    break;
    case "updateLog": {
      let messageId = web.messageId;
      let extra = JSON.parse(web.extra);
      let todayDB = logDBs.today;
      todayDB.update({ messageId: messageId }, { $set: { extra: extra } }, {},  function (err:any, numReplaced: number) {
        console.log("updateLog", numReplaced+"条记录");
      })
    }
    break;
    case "setEncryption": {
      let encryption = web.encryption;
      let target = vscode.ConfigurationTarget.Global;
      vscode.workspace.getConfiguration().update('codemsg.encryption', encryption, target);
    }
    break;
    case "changeIp" : {
      let ip = web.ip;
      IPMsg.instance().setDefautIP(ip);
    }
  }
}

const postWebMessage =  function(webview: vscode.Webview, type: string, data: {}) {
  webview.postMessage({
    type,
    data
  });
}

export {
 handleMessage,
 postWebMessage
}
