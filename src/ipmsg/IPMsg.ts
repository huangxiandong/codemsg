import * as dgram from "dgram";
import * as net from "net";
import * as os from "os";
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as vscode from 'vscode';
import IPMdef from "./IPMdef";
import { IPMPack } from "./IPMPack" 
import { MyBuffer } from "./MyBuffer";
import { WebviewMessage } from "./WebviewMessage";
import { MyFile } from "./MyFile";
import path = require("path");
import * as iconv from "iconv-lite";

export class IPMsg {
  private static PORT = 2425;
  private static HOST = "0.0.0.0";
  
  private mode = "FeiQ"; //FeiQ/ipmsg
  private nickname = "";
  private group = ""
  private homeLocation = path.join(os.homedir(), ".codemsg");
  private encrypt = true;
  private defaultIP = "";

  private networkList:string[] = [];
  private sendFileCache = new Map<number, any>();

  private myRSAKey?: any;
  private priKey?: string;
  private publicKeyMap = new Map<string, any>();
  private myFingerPrint?: string = undefined;

  private static ipmsg : IPMsg;

  private udpSocket : dgram.Socket;
  private tcpServer : net.Server;
  private webview: vscode.Webview;

  private packetNo = 0;

  constructor(webview: vscode.Webview) {
    this.webview = webview;
    this.udpSocket = dgram.createSocket('udp4');
    this.tcpServer = net.createServer();
    this.setupEncryption();
  }

  public static instanceWithWebview(webview: vscode.Webview) : IPMsg {
    IPMsg.ipmsg = new IPMsg(webview);
    return IPMsg.ipmsg;
  }

  public static instance() : IPMsg {
    return IPMsg.ipmsg;
  }

  /************** udp&tcp server ***************/
  public start() : void {
    console.log("IPMsg", "start");
    let me = this;
    let socket = this.udpSocket;
    
    try {
      socket.bind(IPMsg.PORT, IPMsg.HOST, () => {
        socket.setBroadcast(true); 
      });   
    } catch(e) {
      console.log("exception", e);
    }

    socket.on('message', function(message, remote) {
      let packet = IPMPack.from(message);
      let command = Number(packet.command);
      let optMask	= 0xffffff00;
      let cmdMask = 0x000000ff;
      let cmd = command & cmdMask;
      let opt = command & optMask;
  
      me.onUdpData(cmd, opt, packet, remote, message);
    });

    this.tcpServer.on("connection", function(socket) {
      console.log("new connection", socket.address());
      socket.on("data", function(data){
        me.onTcpData(socket, data);
      });
    }).listen(IPMsg.PORT,function(){   
      console.log('tcp server is listening on ' + IPMsg.PORT);
    });
  }

  public stop() : void {
    let socket = this.udpSocket;
    socket.close();
    this.tcpServer.close();
  }

  /************** Recever ***************/
  private onUdpData(cmd: number, opt: number, packet: IPMPack, remote: dgram.RemoteInfo, data: Buffer): void {
    console.log("command", cmd);
    const debug = vscode.workspace.getConfiguration().get('codemsg.debug');
    switch(cmd) {
      case IPMdef.IPMSG_BR_ENTRY:
        this.onEntry(opt, packet, remote);
        if(typeof debug === 'object') {
          let obj: any = debug;
          if(obj !== undefined && obj.entry) {
            this.outputDebugData(cmd, opt, packet, remote, data);
          }
        }
        break;
      case IPMdef.IPMSG_BR_EXIT:
        this.onExit(opt, packet, remote);
        break;
      case IPMdef.IPMSG_ANSENTRY:
        this.onAnsEntry(opt, packet, remote);
        if(typeof debug === 'object') {
          let obj: any = debug;
          if(obj !== undefined && obj.ansentry) {
            this.outputDebugData(cmd, opt, packet, remote, data);
          }
        }
        break;
      case IPMdef.IPMSG_BR_ABSENCE:
        this.onAbsence(opt, packet, remote);
        break;
      case IPMdef.IPMSG_SENDMSG:
        this.onSendMsg(opt, packet, remote);
        break;
      case IPMdef.IPMSG_RECVMSG:
        this.onRecvMsg(opt, packet, remote);
        break;
      case IPMdef.IPMSG_READMSG:
        this.onReadMsg(opt, packet, remote);
        break;
      case IPMdef.IPMSG_ANSREADMSG:
        this.onAnsReadMsg(opt, packet, remote);
        break;
      case IPMdef.IPMSG_RELEASEFILES:
        this.onReleaseFiles(opt, packet, remote);
        break;
      case IPMdef.IPMSG_GETPUBKEY:
        this.onGetPubkey(opt, packet, remote);
        break;
      case IPMdef.IPMSG_ANSPUBKEY:
        this.onAnsPubkey(opt, packet, remote);
        break;
    }
  }

  private onTcpData(socket: net.Socket, request: Buffer) : void {
    let me = this;
    let packet = IPMPack.from(request);
    console.log("transmitFile", packet.toString());
    let command = Number(packet.command);
    let optMask	= 0xffffff00;
    let cmdMask = 0x000000ff;
    let cmd = command & cmdMask;
    let opt = command & optMask;
    
    let ip = socket.remoteAddress;
    let address = "";
    if(ip !== undefined) {
      address = ip.indexOf('::ffff:') === 0 ? ip.substring(7) : ip;
    }
    
    let ss = packet.extra.split(":");
    let hexId = this.trim(ss[0]);
    let packetId = Number.parseInt(hexId, 16);
    let fileId = Number.parseInt(this.trim(ss[1]), 16);

    socket.on("close", function() {
      console.log("connection close" , socket);
      socket.destroy();
      let message = new WebviewMessage("fileUpdate", {
        address: address,
        port: 2425
      },{
        packetId: packetId,
      },{
        fileId: fileId,
        fields: [{
          name: "status",
          value: 3
        }]
      });
      me.postWebviewMessage(message.toString());
    });

    if(cmd == IPMdef.IPMSG_GETDIRFILES) {
      this.transmitDir(packet, {address, port:2425, packetId, fileId}, socket);
      
    } else if(cmd == IPMdef.IPMSG_GETFILEDATA) {
      this.transmitFile(packet, address, socket);
    }
  }

  private onEntry(opt: number, packet: IPMPack, remote: dgram.RemoteInfo): void {
    console.log("onEntry", remote);
    let feiq = false;
    let clientName = "IPMsg";
    if(packet.version.indexOf("#") != -1) {
      feiq = true;
      clientName = "FeiQ";
    }
    let myself = this.isMyself(remote);
    if(!myself) {
      this.ansentry(remote.port, remote.address, feiq);
    }
    const extra = packet.extra;
    let ss = extra.split("\0");

    let address = remote.address;
    let port = remote.port;
    let user = packet.user; //nickname
    let host  = packet.host; //group
    let nickname = ss[0]; //nickname
    let group  = ss[1]; //group
    if(opt & IPMdef.IPMSG_CAPUTF8OPT) {
      let info = ss[2];
      if(info !== undefined) {
        let items = info.split("\x0a");
        for(let item of items) {
          let abc = item.trim();
          if(abc.startsWith("UN:")) {
            user = abc.substring(3);
          } else if(abc.startsWith("HN:")) {
            host = abc.substring(3);
          } else if(abc.startsWith("NN:")) {
            nickname = abc.substring(3);
          } else if(abc.startsWith("GN:")) {
            group = abc.substring(3);
          } else if(abc.startsWith("CN:")) {
            clientName = abc.substring(3);
          }
        }
      }
    }

    let message = new WebviewMessage("entry", {
      address: address,
      port: port
    },{
      version: packet.version,
      packetId: packet.no,
      command: packet.command,
      user: user,
      host: host
    },{
      myself: myself,
      nickname: nickname,
      group: group,
      client: clientName
    });

    this.postWebviewMessage(message.toString());
  }

  private onExit(opt: number, packet: IPMPack, remote: dgram.RemoteInfo): void {
    console.log("onExit", remote);
    let address = remote.address;
    let port = remote.port;
    let message = new WebviewMessage("exit", {
      address: address,
      port: port
    },{
      version: packet.version,
      packetId: packet.no,
      command: packet.command,
      user: packet.user,
      host: packet.host
    },{
    });

    this.postWebviewMessage(message.toString());
  }

  private onAbsence(opt: number, packet: IPMPack, remote: dgram.RemoteInfo): void {
    console.log("onAbsence", remote);
    const extra = packet.extra;
    let ss = extra.split("\0");

    let address = remote.address;
    let port = remote.port;
    let nickname = ss[0]; //nickname
    let group  = ss[1]; //group
    if(opt & IPMdef.IPMSG_CAPUTF8OPT) {
      let info = ss[2];
      if(info !== undefined) {
        let items = info.split("\x0a");
        for(let item of items) {
          let abc = item.trim();
          if(abc.startsWith("NN:")) {
            nickname = abc.substring(3);
          } else if(abc.startsWith("GN:")) {
            group = abc.substring(3);
          }
        }
      }
    }
    let message = new WebviewMessage("absence", {
      address: address,
      port: port
    },{
      version: packet.version,
      packetId: packet.no,
      command: packet.command,
      user: packet.user,
      host: packet.host
    },{
      nickname: nickname,
      group: group
    });

    this.postWebviewMessage(message.toString());
  }

  private onAnsEntry(opt: number, packet: IPMPack, remote: dgram.RemoteInfo): void {
    console.log("onAnsEntry", remote);
    const extra = packet.extra;
    let ss = extra.split("\0");
    let clientName = "IPMsg";
    if(packet.version.indexOf("#") != -1) {
      clientName = "FeiQ";
    }

    let address = remote.address;
    let port = remote.port;
    let user = packet.user; //nickname
    let host  = packet.host; //group
    let nickname = ss[0]; //nickname
    let group  = ss[1]; //group
    if((opt & IPMdef.IPMSG_UTF8OPT) && ss.length > 2) {
      let info = ss[2];
      if(info !== undefined) {
        let items = info.split("\x0a");
        for(let item of items) {
          let abc = item.trim();
          if(abc.startsWith("CN:")) {
            clientName = abc.substring(3);
          }
        }
      }
    }
    if((opt & IPMdef.IPMSG_ENCRYPTOPT) && this.encrypt) {
      this.getPublicKey(remote);
    }

    let message = new WebviewMessage("ansentry", {
      address: address,
      port: port
    },{
      version: packet.version,
      packetId: packet.no,
      command: packet.command,
      user: user,
      host: host
    },{
      nickname: nickname,
      group: group,
      client: clientName
    });

    this.postWebviewMessage(message.toString());
  }

  private onSendMsg(opt: number, packet: IPMPack, remote: dgram.RemoteInfo): void {
    console.log("onSend", packet);
    const packetNo = this.generateNo();
    if((opt & IPMdef.IPMSG_SENDCHECKOPT) != 0) {
      let command = IPMdef.IPMSG_RECVMSG;
      let extra = Buffer.from(`${packet.no}`);
      let msg = this.makePacket(command, packetNo, extra);
      let port: number = remote.port;
      let address: string = remote.address;
      this.udpSend(address, port, msg);
    }
    if((opt & IPMdef.IPMSG_SECRETOPT)) {
      let cmd = IPMdef.IPMSG_READMSG;
      let opt = IPMdef.IPMSG_READCHECKOPT;
      let extra = Buffer.from(`${packet.no}`);
      let msg = this.makePacket(cmd | opt, packetNo, extra);
      let port: number = remote.port;
      let address: string = remote.address;
      this.udpSend(address, port, msg);
    }
    // vscode.window.showInformationMessage("收到新消息", `地址: ${remote.address}`);
    if((opt & IPMdef.IPMSG_FILEATTACHOPT)) {
      this.onFileMessage(opt, remote.address, remote.port, packet);
    } else {
      this.onTextMessage(opt, remote.address, remote.port, packet);
    }
  }

  private onRecvMsg(opt: number, packet: IPMPack, remote: dgram.RemoteInfo): void {
    console.log("onReceive", packet);
    //收到确认消息,用于消息重发
  }

  private onReadMsg(opt: number, packet: IPMPack, remote: dgram.RemoteInfo): void {
    console.log("onReadmsg", packet);
    const packetNo = this.generateNo();
    if((opt & IPMdef.IPMSG_READCHECKOPT) != 0) {
      let command = IPMdef.IPMSG_ANSREADMSG;
      let extra = Buffer.from(`${packet.no}`);
      let msg = this.makePacket(command, packetNo, extra);
      let port: number = remote.port;
      let address: string = remote.address;
      this.udpSend(address, port, msg);
    }
  }

  private onAnsReadMsg(opt: number, packet: IPMPack, remote: dgram.RemoteInfo): void {
    console.log("onAnsrReadMsg", packet);
    //todo
  }

  private onReleaseFiles(opt: number, packet: IPMPack, remote: dgram.RemoteInfo): void {
    console.log("onReleaseFiles", packet);
    let address = remote.address;
    let port = remote.port;
    const packetNo = Number.parseInt(this.trim(packet.extra));

    let message = new WebviewMessage("fileUpdate", {
      address: address,
      port: port
    },{
      packetId: packetNo,
    },{
      fields: [{
        name: "status",
        value: 4
      }]
    });
    this.postWebviewMessage(message.toString());
  }

  private onGetPubkey(opt: number, packet: IPMPack, remote: dgram.RemoteInfo): void {
    console.log("onGetPubkey", remote);
    this.ansPubkey(remote);
  }

  private onAnsPubkey(opt: number, packet: IPMPack, remote: dgram.RemoteInfo): void {
    console.log("onAnsPubkey", remote, packet);
    let ciphers = crypto.getCiphers();    
    console.log("ciphers", ciphers);
    let ss = packet.extra.split(":");
    let cap = Number.parseInt(ss[0], 16);
    let pubkey = this.trim(ss[1]);
    let pks = pubkey.split("-");
    let exp = Number.parseInt(pks[0], 16);
    let modulus = Buffer.from(pks[1], 'hex');

    const NodeRSA = require('node-rsa');
    let rsakey = new NodeRSA();
    rsakey.setOptions({
      environment: 'node',
      encryptionScheme: 'pkcs1'
    });
    rsakey.importKey({
      e: exp,
      n: modulus
    });
    this.publicKeyMap.set(remote.address, {
      cap: cap,
      pubkey: rsakey
    })
  }

  private onTextMessage(opt: number, address: string, port: number, packet: IPMPack) : void {
    console.log("onTextMessage", address);
    let extra = this.trim(packet.extra);
    let text = extra;
    if(opt & IPMdef.IPMSG_ENCRYPTOPT) {
      text = this.decryptMessage(opt, address, port, packet);
    }
    let message = new WebviewMessage("text", {
      address: address,
      port: port
    },{
      version: packet.version,
      packetId: packet.no,
      command: packet.command,
      user: packet.user,
      host: packet.host
    },{
      text: text
    });
    this.postWebviewMessage(message.toString());
  }

  private decryptMessage(opt: number, address: string, port: number, packet: any) : string {
    let extra = this.trim(packet.extra);
    let ss = extra.split(":");
    let cap = Number.parseInt(ss[0], 16);
    if(cap & IPMdef.IPMSG_AES_256) { //目前只支持AES256
      console.log("decryptMessage, ACES256", address);
      let keydata = Buffer.from(this.trim(ss[1]), "hex");
      let aesKey = this.myRSAKey.decrypt(keydata);
      let enText = Buffer.from(this.trim(ss[2]), "hex");
      
      const algorithm = 'aes-256-cbc';
      const iv = Buffer.alloc(16, 0); // Initialization vector.
  
      const cipher = crypto.createDecipheriv(algorithm, aesKey, iv);
      let updateBuff = cipher.update(enText);
      let finalBuff =  cipher.final();
      let deBuff = Buffer.concat([updateBuff, finalBuff]);
      let feiq = packet.version.indexOf("#") != -1;
      let text = extra; 
      if(feiq) {
        text = iconv.decode(deBuff, "GBK");
        text = this.trim(text);
      } else {
        text = deBuff.toString();
        text = this.trim(text);
      }
      return text;  
    }
    return extra;
  }

  private onFileMessage(opt: number, address: string, port: number, packet: IPMPack) : void {
    // console.log("onFileMessage", packet.extra);
    let msges = packet.extra.split("\0");
    let text = msges[0];
    if(opt & IPMdef.IPMSG_ENCRYPTOPT) {
      text = this.decryptMessage(opt, address, port, {
        version: packet.version,
        extra: text
      });
    }
    //IPMsg会把消息和文件相关的内容都加密放到消息里，后边仍然追加文件相关信息
    let tts = text.split("\0");
    text = tts[0];

    let filemsg = msges[1];
    let ss = filemsg.split("\x07");
    let files = [];
      for(let s of ss) {
        let temp = this.trim(s.trim());
        if(temp !== "" && temp.indexOf(":") != -1) {
          let fi = this.getFileInfo(temp);
          files.push({
            fileId: fi.fileId,
            name: fi.name,
            size: fi.size,
            mtime: fi.mtime,
            attr: fi.attr,
            accept: true,
            status: 1,
            progress: 0,
          })
        }
      }
      let message = new WebviewMessage("file", {
        address: address,
        port: port
      },{
        version: packet.version,
        packetId: packet.no,
        command: packet.command,
        user: packet.user,
        host: packet.host
      },{
        text: text,
        files: files,
        status: 1, //1.ready, 2.processing, 3.finish, 4. reject
        progress: 0,
        location: "",
      });

      this.postWebviewMessage(message.toString());
  }

  public recvFiles(remote: any, packet: any, extra: any, location: string) : void {
    console.log("recvFile", remote, packet, extra);
    let home = this.homeLocation;
    try {
      fs.accessSync(home, fs.constants.F_OK);
    } catch(err) {
      fs.mkdirSync(home);
    }    
    let address = remote.address;
    let port = remote.port;
    let packetId = packet.packetId;
    let files = extra.files;
    for(let file of files) {
      if(file.accept) {
        if(file.attr == IPMdef.IPMSG_FILE_REGULAR) {
          this.recvFile(address, port, packetId, file.fileId, file.name, file.size, location);
        } else if(file.attr == IPMdef.IPMSG_FILE_DIR) {
          this.recvDir(remote, packet, file, location);
        }
      }
    }
  }

  public recvFile(address: string, port: number, packetId: number, fileId: number, fileName: string, size: number, location: string) : void {
    let me = this;
    let fileSize = size;
    const socket = new net.Socket();
    //socket.setEncoding("utf-8");
    let cmd = IPMdef.IPMSG_GETFILEDATA;
    let opt = IPMdef.IPMSG_CAPUTF8OPT | IPMdef.IPMSG_UTF8OPT;
    let hexPacketId = packetId.toString(16);
    let hexFileId = fileId.toString(16);
    let extra = `${hexPacketId}:${hexFileId}:0:\0`;
    console.log("recvSingleFile", `extra=${extra}`);
    const pocketNo = this.generateNo();

    let msgGetFile = this.makePacket(cmd | opt, pocketNo, Buffer.from(extra));

    // let home = this.homeLocation;
    let home = location;
    try {
      fs.accessSync(home, fs.constants.F_OK);
    } catch(err) {
      fs.mkdirSync(home);
    }    

    socket.connect(port, address, function() {
      socket.write(msgGetFile);
    });
    let fullpath = home + "/" + fileName;
    let total = 0;
    let fd = fs.openSync(fullpath, "w+");
    let _percentage = 0;
    socket.on('data', function(data) {
      console.log("data size", data.length);
      total += data.length; 
      fs.writeSync(fd, data);
      let temp = total * 100 / fileSize + "";
      let percentage = Number.parseInt(temp);
      if((percentage - _percentage) > 5) {
        _percentage = percentage;
        let message = new WebviewMessage("fileUpdate", {
          address: address,
          port: port
        },{
          packetId: packetId,
        },{
          fileId: fileId,
          fields: [{
            name: "progress",
            value: percentage
          }]
        });
        me.postWebviewMessage(message.toString());
      }
      if(total == fileSize) {
        //接收完毕，主动关闭连接
        socket.destroy();
        fs.closeSync(fd);  
        
        let message = new WebviewMessage("fileUpdate", {
          address: address,
          port: port
        },{
          packetId: packetId,
        },{
          fileId: fileId,
          fields: [
            {
              name: "progress",
              value: 100
            },
            {
              name: "status",
              value: 3
            }
          ]
        });
        me.postWebviewMessage(message.toString());
      }
    });
  }

  private recvDir(remote: any, packet: any, file: any, location: string) : void {
    let me = this;
    let address = remote.address;
    let port = remote.port;
    let packetId = packet.packetId;
    let fileId = file.fileId;

    let cmd = IPMdef.IPMSG_GETDIRFILES;
    let opt = IPMdef.IPMSG_CAPUTF8OPT | IPMdef.IPMSG_UTF8OPT;
     
    let hexPacketId = packetId.toString(16);
    let hexFileId = fileId.toString(16);
    let extra = `${hexPacketId}:${hexFileId}\0`;
    console.log("recvDir", `extra=${extra}`);
    const pocketNo = this.generateNo();

    let msgBuff = this.makePacket(cmd | opt, pocketNo, Buffer.from(extra));

    // let home = this.homeLocation;
    let home = location;
    try {
      fs.accessSync(home, fs.constants.F_OK);
    } catch(err) {
      fs.mkdirSync(home);
    }    

    const socket = new net.Socket();
    socket.connect(port, address, function() {
      socket.write(msgBuff);
    });

    let encoding = remote.feiq ? "GBK" : undefined;
    let myFile = new MyFile(this.webview, {
      address: address,
      port: port,
      packetId: packetId
    },
    home, encoding);
    socket.on('data', function(data) {
      myFile = myFile.parse(data);
      if(myFile.isFinished()) {
        //接收完毕，主动关闭连接
        socket.destroy();
        console.log("recvDir close socket");
        let message = new WebviewMessage("fileUpdate", {
          address: address,
          port: port
        },{
          packetId: packetId,
        },{
          fileId: fileId,
          fields: [
            {
              name: "progress",
              value: 100
            },
            {
              name: "status",
              value: 3
            }
          ]
        });
        me.postWebviewMessage(message.toString());
      }
    });
  }
  
  private transmitDir(packet: IPMPack, option: {address: string, port: number, packetId: number, fileId: number}, socket : net.Socket) {
    console.log("IPMdef.IPMSG_GETDIRFILES", packet.extra);
    let ss = packet.extra.split(":");
    let hexId = this.trim(ss[0]);
    let packetId = Number.parseInt(hexId, 16);
    let allFiles =  this.sendFileCache.get(packetId);
    let fileId = Number.parseInt(this.trim(ss[1]), 16);
    let file: { fileId: number; size: number; path: string; } | undefined = undefined;
    for(let f of allFiles) {
      if(f.fileId === fileId) {
        file = f;
        break;
      }
    }
    if(file !== undefined) {
      let address = option.address;
      let message = new WebviewMessage("fileUpdate", {
        address: address,
        port: 2425
      },{
        packetId: packetId,
      },{
        fileId: file.fileId,
        fields: [{
            name: "status",
            value: 2
          }
        ]
      });      
      this.postWebviewMessage(message.toString());

      let root = file.path;
      this.transmitDirSingle(packet, option, socket, root);
    }
  }

  private transmitDirSingle(packet: IPMPack, option: {address: string, port: number, packetId: number, fileId: number}, socket : net.Socket, dir: string) {
    let me = this;
    let address = option.address;
    this.transmitDirEnter(packet, option, socket, dir);
    let files = fs.readdirSync(dir);
    for(let file of files) {
      let subpath = path.join(dir, file);
      let stats = fs.statSync(subpath);
        if(stats.isFile()){               
          me.transmitDirFile(packet, option, socket, subpath);
        } else if (stats.isDirectory()) {
          me.transmitDirSingle(packet, option, socket, subpath);
        }
    
    }
    this.transmitDirLeave(packet, option, socket, dir);
  }

  private transmitDirEnter(packet: IPMPack, option: {address: string, port: number, packetId: number, fileId: number}, socket : net.Socket, dir: string) {
    console.error("transmitDirEnter", dir);
    let feiq = false;
    if(packet.version.indexOf("#") != -1) {
      feiq = true;
    }
    let tempPath = dir.replace(/\\/g, "/");
    let index = tempPath.lastIndexOf("/");
    let fileName = dir;
    if(index != -1) {
      fileName = tempPath.substring(index+1);
    }
    let fi = fs.statSync(dir);
    let fileSize = fi.size.toString(16);
    let fileAttr = IPMdef.IPMSG_FILE_DIR.toString(16);
    let myBuff = new MyBuffer();
    if(feiq) {
      myBuff.append(`:${fileName}`, "GBK");
    } else {
      myBuff.append(`:${fileName}`);
    }
    let strEnter = `:${fileSize}:${fileAttr}:`
    myBuff.append(strEnter);

    let length = myBuff.length() + 4; //head size 4
    let hexHeadSize = length.toString(16);
    let leftLen = 4-hexHeadSize.length;
    let headPrefix = "";
    for(let i=0; i<leftLen; i++) {
      headPrefix = `${headPrefix}0`;
    }
    let headSize = `${headPrefix}${hexHeadSize}`;
    let allBuff = Buffer.concat([Buffer.from(`${headSize}`), myBuff.toBuffer()]);
    socket.write(allBuff);
  }

  private transmitDirFile(packet: IPMPack, option: {address: string, port: number, packetId: number, fileId: number}, socket : net.Socket, dir: string) {
    console.log("transmitDirFile", dir);
    let feiq = false;
    if(packet.version.indexOf("#") != -1) {
      feiq = true;
    }
    let tempPath = dir.replace(/\\/g, "/");
    let index = tempPath.lastIndexOf("/");
    let fileName = dir;
    if(index != -1) {
      fileName = tempPath.substring(index+1);
    }
    let fi = fs.statSync(dir);
    let fileSize = fi.size.toString(16);
    let fileAttr = IPMdef.IPMSG_FILE_REGULAR.toString(16);
    let myBuff = new MyBuffer();
    if(feiq) {
      myBuff.append(`:${fileName}`, "GBK");
    } else {
      myBuff.append(`:${fileName}`);
    }
    let strEnter = `:${fileSize}:${fileAttr}:`
    myBuff.append(strEnter);

    let length = myBuff.length() + 4; //head size 4
    let hexHeadSize = length.toString(16);
    let leftLen = 4-hexHeadSize.length;
    let headPrefix = "";
    for(let i=0; i<leftLen; i++) {
      headPrefix = `${headPrefix}0`;
    }
    let headSize = `${headPrefix}${hexHeadSize}`;
    let allBuff = Buffer.concat([Buffer.from(`${headSize}`), myBuff.toBuffer()]);
    socket.write(allBuff);

    let fd = fs.openSync(dir, "r");
    let total = 0;
    this.postPercentage(option, 0);
    let _percentage = 0;
    let buffLen = 64 * 1024;
    while(total < fi.size) {
      let buff = Buffer.alloc(buffLen);
      let size = fs.readSync(fd, buff, 0, buffLen, null);
      if(size < buffLen) {
        let msg = Buffer.alloc(size);
        buff.copy(msg, 0, 0, size);
        socket.write(msg)
      } else {
        socket.write(buff);
      }
      total += size;
      let temp = total * 100 / fi.size + "";
      let percentage = Number.parseInt(temp);
      if((percentage-_percentage) > 5) {
        _percentage = percentage;
        this.postPercentage(option, percentage);
      }
    }
    fs.close(fd, ()=>{
      console.log("file closed", dir);
    });
  }

  private transmitDirLeave(packet: IPMPack, option: {address: string, port: number, packetId: number, fileId: number}, socket : net.Socket,  dir: string) {
    console.error("transmitDirLeave", dir);
    let strLeave = `:.:0:${IPMdef.IPMSG_FILE_RETPARENT}:`;
    let length = strLeave.length;    
    length += 4; //head size 4
    let hexHeadSize = length.toString(16);
    let leftLen = 4-hexHeadSize.length;
    let headSize = "";
    for(let i=0; i<leftLen; i++) {
      headSize = `${headSize}0`;
    }
    headSize = `${headSize}${hexHeadSize}`;
    let allBuff = Buffer.from(`${headSize}${strLeave}`);
    socket.write(allBuff);
  }

  private transmitFile(packet: IPMPack, address: string, socket: net.Socket) {
    let me = this;
    console.log("IPMdef.IPMSG_GETFILEDATA", packet.extra);
    let ss = packet.extra.split(":");
    let hexId = this.trim(ss[0]);
    let packetId = Number.parseInt(hexId, 16);
    console.log("transmitFile, packetId = ", packetId);
    let allFiles =  this.sendFileCache.get(packetId);
    let fileId = Number.parseInt(this.trim(ss[1]), 16);
    let file: { fileId: number; size: number; path: string; } | undefined = undefined;
    for(let f of allFiles) {
      if(f.fileId === fileId) {
        file = f;
        break;
      }
    }
    if(file !== undefined) {
      let fileSize = file.size;
      // let rs = fs.createReadStream(file.path);
      let total = 0;
      let message = new WebviewMessage("fileUpdate", {
        address: address,
        port: 2425
      },{
        packetId: packetId,
      },{
        fileId: file.fileId,
        fields: [{
            name: "status",
            value: 2
          }
        ]
      });      
      this.postWebviewMessage(message.toString());

      let _percentage = 0;
      /*
      rs.on('data', function(data){
        total += data.length;
        socket.write(data);
        let temp = total * 100 / fileSize + "";
        let percentage = Number.parseInt(temp);
        if((percentage-_percentage) > 5) {
          _percentage = percentage;
          let message = new WebviewMessage("fileUpdate", {
            address: address,
            port: 2425
          },{
            packetId: packetId,
          },{
            fileId: fileId,
            fields: [{
              name: "progress",
              value: percentage
            }]
          });
          me.postWebviewMessage(message.toString());
        }
      });
      rs.on('end',function() {
        rs.close();
      });
      rs.on('error', function(err) {
          console.log(err.stack);
      });
      */
       
      let fd = fs.openSync(file.path, "r");
      let buffLen = 64*1024;
      while(total < fileSize) {
        let buff = Buffer.alloc(buffLen);
        let size = fs.readSync(fd, buff, 0, buffLen, null);
        if(size < buffLen) {
          let msg = Buffer.alloc(size);
          buff.copy(msg, 0, 0, size);
          socket.write(msg)
        } else {
          socket.write(buff);
        }
        total += size;
        let temp = total * 100 / fileSize + "";
        let percentage = Number.parseInt(temp);
        if((percentage-_percentage) > 5) {
          _percentage = percentage;
          let message = new WebviewMessage("fileUpdate", {
            address: address,
            port: 2425
          },{
            packetId: packetId,
          },{
            fileId: fileId,
            fields: [{
              name: "progress",
              value: percentage
            }]
          });
          me.postWebviewMessage(message.toString());
        }
      }
      fs.close(fd, ()=>{
        console.log("file closed", file===undefined?"":file.path);
      });            
    }
  }

  /************** Sender ***************/
  // IPMdef.IPMSG_BR_ENTRY
  public entry(setting: any) : void {
    this.publicKeyMap.clear();
    let nickname = setting.nickname;
    let group = setting.group;
    let home = setting.home;
    let networkList = setting.networkList;
    let encrypt = setting.encrypt;

    this.mode = setting.mode;
    this.nickname = nickname;
    this.group = group;
    if(home !== "") {
      this.homeLocation = home;
    }
    this.networkList = networkList;
    this.encrypt = encrypt;

    let cmd = IPMdef.IPMSG_NOOPERATION;
    let opt = IPMdef.IPMSG_CAPUTF8OPT | IPMdef.IPMSG_FILEATTACHOPT;
    let packetNo = this.generateNo();

    let noopBuff = this.makePacket(cmd|opt, packetNo);
    this.broadcast(noopBuff);

    cmd = IPMdef.IPMSG_BR_ENTRY;
    opt = IPMdef.IPMSG_CAPUTF8OPT | IPMdef.IPMSG_UTF8OPT | IPMdef.IPMSG_FILEATTACHOPT;
    if(this.encrypt) {
      opt = opt | IPMdef.IPMSG_ENCRYPTOPT;
    }
    let user = os.userInfo().username;
    let tempnick = (nickname === undefined || nickname === '') ? user : nickname;
    let myBuff = new MyBuffer();
    let extra = `${tempnick}\0`;
    if(group !== undefined && group !== "") {
      extra = `${extra}${group}`;
    }  
    if(this.mode === "IPMsg") {
      myBuff.append(extra);  
    } else {
      myBuff.append(extra, "GBK");    
    }
    let utf8Entry = this.makeUtf8Entry();
    myBuff.append(utf8Entry);
    let buff = myBuff.toBuffer();
    packetNo = this.generateNo();
    let msgBuff = this.makePacket(cmd|opt, packetNo, buff);
    this.broadcast(msgBuff);
  }

  public reentry(remote:any, setting:any) : void {
    this.publicKeyMap.delete(remote.address);
    
    let nickname = setting.nickname;
    let group = setting.group;
    let cmd = IPMdef.IPMSG_BR_ENTRY;
    let opt = IPMdef.IPMSG_CAPUTF8OPT | IPMdef.IPMSG_UTF8OPT | IPMdef.IPMSG_FILEATTACHOPT;
    if(this.encrypt) {
      opt = opt | IPMdef.IPMSG_ENCRYPTOPT;
    }
    const user = os.userInfo().username;
    let tempnick = (nickname === undefined || nickname === '') ? user : nickname;
    let myBuff = new MyBuffer();
    let extra = `${tempnick}\0`;
    if(group !== undefined && group !== "") {
      extra = `${extra}${group}`;
    }  
    if(this.mode === "IPMsg") {
      myBuff.append(extra);  
    } else {
      myBuff.append(extra, "GBK");    
    }
    let utf8Entry = this.makeUtf8Entry();
    myBuff.append(utf8Entry);
    let buff = myBuff.toBuffer();
    let packetNo = this.generateNo();
    let msgBuff = this.makePacket(cmd|opt, packetNo, buff);
    this.udpSend(remote.address, remote.port, msgBuff);
  }

  //IPMdef.IPMSG_BR_EXIT
  public exit() : void {
    let me = this;
    const user = os.userInfo().username;
    const host = os.hostname();
    const pocketNo = this.generateNo();
    let cmd = IPMdef.IPMSG_BR_EXIT;
    let opt = IPMdef.IPMSG_CAPUTF8OPT | IPMdef.IPMSG_UTF8OPT | IPMdef.IPMSG_FILEATTACHOPT;

    let tempnick = (this.nickname === undefined || this.nickname === '') ? user : this.nickname;
    let extra = `${tempnick}\0`;
    if(this.group !== undefined && this.group !== "") {
      extra = `${extra}${this.group}`;
    }
    let myBuff = new MyBuffer();
    if(this.mode === "IPMsg") {
      myBuff.append(extra);
    } else {
      myBuff.append(extra, "GBK");
    }
    let utf8Entry = this.makeUtf8Entry();
    myBuff.append(utf8Entry);
    let buff = myBuff.toBuffer();
    let msgExit = this.makePacket(cmd|opt, pocketNo, buff);

    let socket = this.udpSocket;
    let allHosts:string[] = [];
    if(this.defaultIP !== undefined) {
      let index = this.defaultIP.lastIndexOf(".");
      if(index != -1) {
        let brHost = this.defaultIP.substring(0, index) + ".255";
        allHosts.push(brHost);
      }
    }
    for(let item of this.networkList) {
      allHosts.push(item);
    }
    console.log("allHosts", allHosts);
    let sentHosts = [];
    for(let brHost of allHosts) {
      socket.send(msgExit, 2425, brHost, function (err, bytes) {
        sentHosts.push(brHost);
        if (err) console.error(err);
        console.log('broadcast message: ' + msgExit);
        if(sentHosts.length == allHosts.length) {
          me.stop();
          console.log("server stopped");
        }
      });
    }
  }

  //IPMdef.IPMSG_ANSENTRY
  private ansentry(port: number, address: string, feiq: boolean): void {
    const user = os.userInfo().username;
    const host = os.hostname();

    let cmd = IPMdef.IPMSG_ANSENTRY;
    let opt = IPMdef.IPMSG_CAPUTF8OPT | IPMdef.IPMSG_UTF8OPT | IPMdef.IPMSG_FILEATTACHOPT;
    if(this.encrypt) {
      opt = opt | IPMdef.IPMSG_ENCRYPTOPT;
    }
    
    let nickname = (this.nickname === undefined || this.nickname === '') ? user : this.nickname;
    let extra = `${nickname}\0`;
    if(this.group !== undefined && this.group !== "") {
      extra = `${extra}${this.group}`;
    }
    extra = `${extra}\0\nCN:CodeMsg`;

    let myBuff = new MyBuffer();
    if(feiq) {
      myBuff.append(extra, "GBK");
    } else {
      myBuff.append(Buffer.from(extra));
    }
    let buff = myBuff.toBuffer();
    
    const packetNo = this.generateNo();
    let msgBuff = this.makePacket(cmd | opt, packetNo, buff);
    this.udpSend(address, port, msgBuff);

    if((opt & IPMdef.IPMSG_ENCRYPTOPT) && this.encrypt) {
      this.getPublicKey({
        address: address,
        port: port
      })
    }
  }

  // IPMdef.IPMSG_BR_ABSENCE
  public absence(mode: string, nickname: string, group: string) : void {
    this.mode = mode;
    this.nickname = nickname;
    this.group = group;
    const user = os.userInfo().username;

    let cmd = IPMdef.IPMSG_BR_ABSENCE;
    let opt = IPMdef.IPMSG_CAPUTF8OPT | IPMdef.IPMSG_UTF8OPT | IPMdef.IPMSG_FILEATTACHOPT;
    if(this.encrypt) {
      opt = opt | IPMdef.IPMSG_ENCRYPTOPT;
    }
    let tempnick = (nickname === undefined || nickname === '') ? user : nickname;
    let extra = `${tempnick}\0`;
    if(group !== undefined && group !== "") {
      extra = `${extra}${group}`;
    }    
    let myBuff = new MyBuffer();
    if(this.mode === "IPMsg") {
      myBuff.append(Buffer.from(extra));
    } else {
      myBuff.append(extra, "GBK");    
    }
    
    let utf8Entry = this.makeUtf8Entry();
    myBuff.append(utf8Entry);

    let packetNo = this.generateNo();
    let buff = myBuff.toBuffer();
    let msgBuff = this.makePacket(cmd|opt, packetNo, buff);
    this.broadcast(msgBuff);
  }

  //IPMdef.IPMSG_SENDMSG
  public sendMsg(remote: any, extra: any): void {
    console.log("sendMsg", remote, extra);
    let cmd = IPMdef.IPMSG_SENDMSG;
    let opt = IPMdef.IPMSG_SENDCHECKOPT | IPMdef.IPMSG_UTF8OPT | IPMdef.IPMSG_CAPUTF8OPT;
    const packetNo = this.generateNo();
    let port: number = remote.port;
    let address: string = remote.address;

    let myBuff = new MyBuffer();
    if(remote.feiq) {
      myBuff.append(`${extra.text}\0`, "GBK");
    } else {
      myBuff.append(Buffer.from(extra.text+"\0"));
    }
    let buff = myBuff.toBuffer();

    if(this.encrypt) {
      let peerKey = this.publicKeyMap.get(remote.address);
      if(peerKey != undefined) {
        const {
          encrypt,
          data
        } = this.encryptMessage(peerKey, buff, remote);
        if(encrypt) {
          opt = opt | IPMdef.IPMSG_ENCRYPTOPT;
        }
        buff = data;
      }
    }
    let msgBuff = this.makePacket(cmd|opt, packetNo, buff);
    this.udpSend(address, port, msgBuff);
  }

  public encryptMessage(peerKey: any, buff: Buffer, remote: any) : {encrypt: boolean, data: Buffer} {
    let flag = 0;
    if(peerKey.cap & IPMdef.IPMSG_RSA_2048) {
      flag = flag | IPMdef.IPMSG_RSA_2048;
    }
    
    let encrypt = false;
    let extra = buff;
    if(peerKey.cap & IPMdef.IPMSG_AES_256) {
      console.log("encryptMessage AES256", remote);
      flag = flag | IPMdef.IPMSG_AES_256;
      const algorithm = 'aes-256-cbc';
      const password = 'Password used to generate key';
      const key = crypto.scryptSync(password, 'salt', 32);
      let nodeRsa = peerKey.pubkey;
      let enKey = nodeRsa.encrypt(key);
      const iv = Buffer.alloc(16, 0); // Initialization vector.
  
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let updateBuff = cipher.update(buff);
      let finalBuff =  cipher.final();
      let enBuff = Buffer.concat([updateBuff, finalBuff]);
      let hexKey = enKey.toString("hex");
      let hexBuff = enBuff.toString("hex");
      encrypt = true;
      
      let shaAlg = "";
      let shaFlag = 0;
      if(peerKey.cap & IPMdef.IPMSG_SIGN_SHA256) {
        shaAlg = "sha256";
        shaFlag = IPMdef.IPMSG_SIGN_SHA256;        
      } else if(peerKey.cap & IPMdef.IPMSG_SIGN_SHA1) {
        shaAlg = "sha1";
        shaFlag = IPMdef.IPMSG_SIGN_SHA1;
      }
      let signature = undefined;
      if(shaAlg !== "") {
        const sign = crypto.createSign(shaAlg);
        sign.write(buff);
        sign.end();
        if(this.priKey !== undefined) {
          signature = sign.sign(this.priKey, "hex");
        }
      }

      flag = flag | shaFlag;
      let hexCap = flag.toString(16);
      let enText = `${hexCap}:${hexKey}:${hexBuff}`;
      if(signature != undefined) {
        enText = `${enText}:${signature}`;
      }
      enText = `${enText}\0`;
      extra = Buffer.from(enText);
    }    
    return {
      encrypt: encrypt, 
      data: extra
    }
  }

  //IPMdef.IPMSG_SENDMSG, IPMdef.IPMSG_FILEATTACHOPT
  public sendFile(remote: any, packet: any, extra: any) : void {
    let cmd = IPMdef.IPMSG_SENDMSG;
    let opt = IPMdef.IPMSG_SENDCHECKOPT | IPMdef.IPMSG_CAPUTF8OPT | IPMdef.IPMSG_UTF8OPT | IPMdef.IPMSG_FILEATTACHOPT;
    let files = extra.files;
    let packetNo = packet.packetId;
    let myBuff = new MyBuffer();
    let msg = "\0";
    let mBuff = Buffer.from(msg);
    if(this.encrypt) {
      let peerKey = this.publicKeyMap.get(remote.address);
      if(peerKey != undefined) {
        const {
          encrypt,
          data
        } = this.encryptMessage(peerKey, mBuff, remote);
        if(encrypt) {
          opt = opt | IPMdef.IPMSG_ENCRYPTOPT;
        }
        mBuff = data;
      }
    }
    myBuff.append(mBuff);

    let temp = "";
    let allFiles = [];
    for(let file of files) {
      let filepath = file.path;
      let fileinfo = fs.statSync(filepath);
      let fileId = file.fileId;
      let tempPath = filepath.replace(/\\/g, "/");
      let index = tempPath.lastIndexOf("/");
      let fileName = filepath;
      if(index  != -1) {
        fileName = filepath.substring(index+1);
      }  
      let hexSize =fileinfo.size.toString(16);
      let mtime = fileinfo.mtime.getTime().toString(16);
      let fileType = IPMdef.IPMSG_FILE_REGULAR;
      if(file.type == 1) {
        fileType = IPMdef.IPMSG_FILE_DIR;
      }
      let ctime = fileinfo.ctime.getTime().toString(16);
      let attr2 = IPMdef.IPMSG_FILE_CREATETIME.toString(16);
      let attr1 = IPMdef.IPMSG_FILE_MTIME.toString(16);
      temp = `${temp}${fileId}:${fileName}:${hexSize}:${mtime}:${fileType}:\x07`;
      allFiles.push({
        fileId: fileId,
        path: filepath,
        size: fileinfo.size
      });
    }
    if(remote.feiq) {
      myBuff.append(temp, "GBK");
    } else {
      myBuff.append(Buffer.from(temp));
    }
    let buff = myBuff.toBuffer();

    let msgBuff = this.makePacket(cmd|opt, packetNo, buff);

    let address = remote.address;
    let port = remote.port;
    this.udpSend(address, port, msgBuff);
    this.sendFileCache.set(packetNo, allFiles);
  }

  //IPMdef.IPMSG_RELEASEFILES
  public rejectFile(remote: any, packet: any) : void {
    let address = remote.address;
    let port = remote.port;
    let packetId = packet.packetId;
    let cmd = IPMdef.IPMSG_RELEASEFILES;
    let extra = packetId + "\0";
    const pocketNo = this.generateNo();
    let msg = this.makePacket(cmd, pocketNo, Buffer.from(extra));
    this.udpSend(address, port, msg);
  }

  //IPMdef.IPMSG_GETPUBKEY
  private getPublicKey(remote: any) {
    console.log("getPublicKey", remote);
    let address = remote.address;
    let port = remote.port;
    let cmd = IPMdef.IPMSG_GETPUBKEY;
    let opt = 0;
    let capability = IPMdef.IPMSG_RSA_2048 | IPMdef.IPMSG_AES_256 | IPMdef.IPMSG_SIGN_SHA256 | IPMdef.IPMSG_SIGN_SHA1;
    let extra = capability.toString(16).toUpperCase() + "\0";
    const pocketNo = this.generateNo();
    let msg = this.makePacket(cmd, pocketNo, Buffer.from(extra));
    this.udpSend(address, port, msg);
  }

  //IPMdf.IPMSG_ANSPUBKEY
  private ansPubkey(remote: dgram.RemoteInfo) {
    let address = remote.address;
    let port = remote.port;
    let cap = IPMdef.IPMSG_RSA_2048 | IPMdef.IPMSG_AES_256 | IPMdef.IPMSG_SIGN_SHA256 | IPMdef.IPMSG_SIGN_SHA1;
    let n = this.myRSAKey.keyPair.n.toString(16);
    let e = this.myRSAKey.keyPair.e.toString(16);
    let extra = cap.toString(16) + ":" + e + "-" + n + "\0";
    let cmd = IPMdef.IPMSG_ANSPUBKEY;
    let opt = 0;
    const pocketNo = this.generateNo();
    let msg = this.makePacket(cmd|opt, pocketNo, Buffer.from(extra));
    this.udpSend(address, port, msg);
  }

  /************** tcp&udp message***************/
  public broadcast(message: Buffer) : void {
    let socket = this.udpSocket;
    let allHosts:string[] = [];
    
    if(this.defaultIP !== undefined) {
     let index = this.defaultIP.lastIndexOf(".");
      if(index != -1) {
        let brHost = this.defaultIP.substring(0, index) + ".255";
        allHosts.push(brHost);
      }
    }

    for(let item of this.networkList) {
      allHosts.push(item);
    }
    console.log("allHosts", allHosts);
    for(let brHost of allHosts) {
      socket.send(message, 2425, brHost, function (err, bytes) {
        if (err) throw err;
        console.log('broadcast message: ' + message);
      });
    }
  }

  private udpSend(address:string, port:number, msg:Buffer): void {
    this.udpSocket.send(msg, port, address, function (err, bytes) {
      if (err) throw err;
      console.log('UDP message sent to ' + address + ':' + port);
    });  
  }

  private makePacket(command: number, packetId: number, extra?: Buffer) : Buffer {
    const version = IPMdef.IPMSG_VERSION;
    let user = os.userInfo().username;
    if(this.myFingerPrint !== undefined) {
      user = `${user}-<${this.myFingerPrint}>`;
    }
    const host = os.hostname();

    let myBuffer = new MyBuffer();
    if(this.mode === "IPMsg") {
      let prefix = `${version}:${packetId}:${user}:${host}:${command}:`;
      myBuffer.append(prefix);
    } else {
      myBuffer.append(`${version}:${packetId}:`)
      .append(`${user}:${host}:`, "GBK")
      .append(`${command}:`)
    }
    if(extra !== undefined) {
      myBuffer.append(extra);
    }

    let buff = myBuffer.toBuffer();
    return buff;
  }

  /************** utils ***************/
  private postWebviewMessage(message: string) : void {
    this.webview.postMessage({
      type: 'fromMain',
      message: message
    });
  }

  private generateNo() : number {
    let now = Math.round(Date.now() / 1000);
    if(now > this.packetNo) {
      this.packetNo = now;
    }
    return this.packetNo++;
  }

  private makeUtf8Entry() : Buffer {
    const username = os.userInfo().username;
    let user = username;
    if(this.myFingerPrint !== undefined) {
      user = `${user}-<${this.myFingerPrint}>`;
    }
    const host = os.hostname();
    let nickname = (this.nickname === undefined || this.nickname === '') ? username : this.nickname;
    let utf8Entry = `\0\nUN:${user}\nHN:${host}\nNN:${nickname}`;
    if(this.group !== undefined && this.group !== "") {
      utf8Entry = utf8Entry + `\nGN:${this.group}`;
    }
    utf8Entry = utf8Entry + `\nCN:CodeMsg`;
    let buff = Buffer.from(utf8Entry);
    return buff;
  }

  private isMyself(remote: dgram.RemoteInfo) : boolean {
    var interfaces = os.networkInterfaces();
    for (var devName in interfaces) {
      let iface = interfaces[devName];
      if(iface !== undefined) { 
        for (var i = 0; i < iface.length; i++) {
          var alias = iface[i];
          let address = alias.address;
          if(address === remote.address) {
            return true;
          }
        }
     }
    }
    return false;
  }

  private getFileInfo(data: string): {fileId: number; name:string; size:number; mtime:string; attr:number} {
    let ss = data.split(":");  
    let fileId = Number.parseInt(this.trim(ss[0]));
    let name = this.trim(ss[1]);
    let size = Number.parseInt(this.trim(ss[2]), 16);
    let mtime = this.trim(ss[3]);
    let attr  = Number.parseInt(this.trim(ss[4]));
    return {
      fileId: fileId,
      name: name,
      size: size,
      mtime: mtime,
      attr: attr
    }
  }

  private trim(src: string): string {
    let start = 0;
    let end = src.length;
    for(let i = 0; i<src.length; i++) {
      if(src.charAt(i) !== '\0') {
        start = i;
        break;
      }
    }
    for(let i = src.length; i > 0; i--) {
      if(src.charAt(i-1) !== '\0') {
        end = i;
        break;
      }
    }
    let dest = src.substring(start, end);
    return dest;
  }

  private outputDebugData(cmd: number, opt: number, packet: IPMPack, remote: dgram.RemoteInfo, data: Buffer) : void {
    let debugFolder = path.join(this.homeLocation, "debug");
    try {
      fs.accessSync(debugFolder, fs.constants.F_OK);
    } catch(err) {
      fs.mkdirSync(debugFolder);
    }
    let now = new Date();
    let fulldate = this.formatDate(now, "yyyyMMdd");
    let fullpath =  path.join(debugFolder, fulldate);
    try {
      fs.accessSync(fullpath, fs.constants.F_OK);
    } catch(err) {
      fs.mkdirSync(fullpath);
    }
    let fileName = "msg.dat";
    if(cmd == IPMdef.IPMSG_BR_ENTRY) {
      fileName = "entry.dat";
    } else if(cmd == IPMdef.IPMSG_ANSENTRY) {
      fileName = "ansentry.dat";
    }
    let filepath = path.join(fullpath, fileName);
    let address = remote.address;
    fs.writeFile(filepath, 
      Buffer.concat([Buffer.from(`${address}&&&&&`),data, Buffer.from("|||||")]), 
      {
        flag: "a+"
      }, 
      () => {

    });
  }

  private formatDate(date: Date, fmt:string) { //author: meizz 
    let o: any = {
        "M+": date.getMonth() + 1, //月份 
        "d+": date.getDate(), //日 
        "H+": date.getHours(), //小时 
        "m+": date.getMinutes(), //分 
        "s+": date.getSeconds(), //秒 
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
        "S": date.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
  }

  private setupEncryption() : void {
    if(this.encrypt) {
      const NodeRSA = require('node-rsa');
      this.myRSAKey = new NodeRSA();
      this.myRSAKey.setOptions({
        environment: 'node',
        encryptionScheme: 'pkcs1'
      });
      let keyfile = path.join(this.homeLocation, "codemsg.key");
      try {
        fs.accessSync(keyfile, fs.constants.F_OK);
        let buff = fs.readFileSync(keyfile);
        this.myRSAKey.importKey(buff, "private");
      } catch(e) {
        this.myRSAKey.generateKeyPair(2048);
        let priKey = this.myRSAKey.exportKey('private');
        fs.writeFile(keyfile, priKey, {
          flag: "w+"
        }, () => {
  
        });
      }
      this.priKey = this.myRSAKey.exportKey("private");
      let modulus = this.myRSAKey.keyPair.n.toString(16);
      console.log("modulus", modulus);
      let buffN = Buffer.from(modulus, "hex");
      let len = buffN.length;
      let buffR = Buffer.alloc(len);
      for(let i=0;i<len; i++) {
        buffR[len-i-1] = buffN[i];
      }
      let hash = crypto.createHash("sha1");
      hash.update(buffR);
      let digest = hash.digest();
      let dLen = digest.length;
      let digestR = Buffer.alloc(dLen);
      for(let i=0; i<dLen; i++) {
        digestR[dLen-i-1] = digest[i];
      }
      let part1 = Buffer.alloc(8);
      let part2 = Buffer.alloc(8);
      let part3 = Buffer.alloc(8);
      digestR.copy(part1, 0, 0, 8);
      digestR.copy(part2, 0, 8, 16);
      digestR.copy(part3, 0, 16, 20);
      let out = Buffer.alloc(8);
      for(let i=0; i<8; i++) {
        out[i] = part1[i] ^ part2[i] ^ part3[i];
      }
      this.myFingerPrint = out.toString("hex");
      console.log("myFingerPrint", this.myFingerPrint);
    }
  }

  private postPercentage(remote: any, percentage: number) {
    let address = remote.address;
    let port = remote.port;
    let packetId = remote.packetId;

    let message = new WebviewMessage("fileUpdate", {
      address: address,
      port: port
    },{
      packetId: packetId,
    },{
      fileId: remote.fileId,
      fields: [{
        name: "progress",
        value: percentage
      }]
    });
    this.postWebviewMessage(message.toString());    
  }

  public setDefautIP(ip: string) {
    this.defaultIP = ip;
  }
}