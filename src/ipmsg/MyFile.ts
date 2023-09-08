import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as vscode from 'vscode';
import * as iconv from "iconv-lite";
import IPMdef from "./IPMdef";
import { MyBuffer } from "./MyBuffer"
import { WebviewMessage } from "./WebviewMessage";

export class MyFile {
  private _buff: MyBuffer = new MyBuffer();
  private _depth = 0;
  private _location?:string;
  private _encoding?: string;

  private _percentage = 0;
  private _fileSize = 0;
  private _recvSize = 0;
  private _status = 0; //0:start 1:transmitting
  private _fd = -1;

  private _webview: vscode.Webview;
  private _remote: any;

  constructor(webview: vscode.Webview, remote: any, location?: string, encoding?: string, depth?: number) {
    this._webview = webview;
    this._remote = remote;

    if(location !== undefined) {
      this._location = location;
    }
    if(this._location === undefined) {
      this._location = path.join(os.homedir(), ".codemsg");
    }
    if(encoding !== undefined) {
      this._encoding = encoding;
    }
    if(depth !== undefined) {
      this._depth = depth;
    }
  }

  private beginFile(buff: Buffer) : MyFile {
    this._buff.append(buff);
    let packetBuff = this._buff.toBuffer();
    let headerSizeEnd = packetBuff.indexOf(0x3a)
    if(headerSizeEnd != -1) {
      let strHeaderSize = packetBuff.toString(undefined, 0, headerSizeEnd);
      let headerSize = Number.parseInt(strHeaderSize, 16);
      if(packetBuff.length >= headerSize) {
        //文件信息收取完毕
        let fileNameEnd = packetBuff.indexOf(0x3a, headerSizeEnd+1);
        let fileName = undefined;
        if(this._encoding===undefined || this._encoding==="") {
          fileName = packetBuff.toString(undefined, headerSizeEnd+1, fileNameEnd);
        } else {
          let fileNameBuff = Buffer.alloc(fileNameEnd-headerSizeEnd-1);
          packetBuff.copy(fileNameBuff, 0, headerSizeEnd+1, fileNameEnd);
          fileName = iconv.decode(fileNameBuff, this._encoding)
        }
        let fileSizeEnd = packetBuff.indexOf(0x3a, fileNameEnd+1);
        let strFileSize = packetBuff.toString(undefined, fileNameEnd+1, fileSizeEnd);
        let fileSize = Number.parseInt(strFileSize, 16);
        this._fileSize = fileSize;
        let fileAttrEnd = packetBuff.indexOf(0x3a, fileSizeEnd+1);
        let strFileAttr = packetBuff.toString(undefined, fileSizeEnd+1, fileAttrEnd);
        let fileAttr = Number.parseInt(strFileAttr, 16);
        if(fileAttr == IPMdef.IPMSG_FILE_DIR) {
          console.log("进入目录", fileName);
          this._depth += 1; //进入一层目录
          let dir = this._location + "/" + fileName;
          try {
            fs.accessSync(dir, fs.constants.F_OK);
          } catch(err) {
            fs.mkdirSync(dir);
          }  
          // fs.mkdirSync(dir);
          let nextFile = new MyFile(this._webview, this._remote, dir, this._encoding, this._depth);
          let leftLen = packetBuff.length - headerSize;
          if(leftLen > 0) {
            let leftBuff = Buffer.alloc(leftLen);
            packetBuff.copy(leftBuff, 0, headerSize);
            return nextFile.parse(leftBuff); 
          }
          return nextFile;
        } else if(fileAttr === IPMdef.IPMSG_FILE_RETPARENT) {
          console.log("返回上一层目录");
          this._depth -= 1;
          let str = this._location?.replace(/\\/g, "/");
          let pos = str?.lastIndexOf("/");
          let dir = str?.substring(0, pos);
          let nextFile = new MyFile(this._webview, this._remote, dir, this._encoding, this._depth);
          let leftLen = packetBuff.length - headerSize;
          if(leftLen > 0) {
            let leftBuff = Buffer.alloc(leftLen);
            packetBuff.copy(leftBuff, 0, headerSize);
            return nextFile.parse(leftBuff); 
          }
          return nextFile;
        } else if(fileAttr === IPMdef.IPMSG_FILE_REGULAR) {
          console.log("接收文件", fileName);
          let filePath = this._location + "/" + fileName;
          let fd = fs.openSync(filePath, "w+");
          this._fd = fd;
          this._status = 1;
          let leftLen = packetBuff.length - headerSize;
          if(leftLen > 0) {
            let leftBuff = Buffer.alloc(leftLen);
            packetBuff.copy(leftBuff, 0, headerSize);
            return this.parse(leftBuff); 
          }
          return this;
        }
      }
    }
    //文件信息未收全，继续接收
    return this;
  }

  private continueFile(buff: Buffer) : MyFile {
    if(buff.length >= (this._fileSize-this._recvSize)) {
      //接受到的数据长度大于或等于剩余文件长度，说明本文件将要接受完毕
      let leftLen = buff.length - (this._fileSize-this._recvSize);
      let leftPos = this._fileSize - this._recvSize;
      fs.writeSync(this._fd, buff, 0, this._fileSize-this._recvSize);
      this._recvSize = this._fileSize;
      fs.closeSync(this._fd);
      this.postPercentage(100);
      let nextFile = new MyFile(this._webview, this._remote, this._location, this._encoding, this._depth);
      if(leftLen > 0) {
        let leftBuff = Buffer.alloc(leftLen);
        buff.copy(leftBuff, 0, leftPos);
        return nextFile.parse(leftBuff);
      } else {
        return nextFile;
      }
    } else {
      //文件接收还未完毕
      if(buff.length > 0) {
        fs.writeSync(this._fd, buff);
      }
      this._recvSize += buff.length;
      let temp = this._recvSize * 100 / this._fileSize + "";
      let percentage = Number.parseInt(temp);
      if((percentage-this._percentage) > 5) {
        this._percentage = percentage;
        this.postPercentage(percentage);
      }
      return this;
    }
  }
  public parse(buff: Buffer) : MyFile {
    if(this._status == 0) { //transmitting
      return this.beginFile(buff);
    } else {
      return this.continueFile(buff);
    }
  }

  public isFinished() : boolean {
    return this._depth == 0;
  }

  private postPercentage(percentage: number) {
    let address = this._remote.address;
    let port = this._remote.port;
    let packetId = this._remote.packetId;

    let message = new WebviewMessage("fileUpdate", {
      address: address,
      port: port
    },{
      packetId: packetId,
    },{
      fields: [{
        name: "progress",
        value: percentage
      }]
    });
    this.postWebviewMessage(message.toString());    
  }

  private postWebviewMessage(message: string) : void {
    this._webview.postMessage({
      type: 'fromMain',
      data: {
        message: message
      }
    });
  }
}