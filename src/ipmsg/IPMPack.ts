import * as iconv from "iconv-lite";
export class IPMPack {
  public _buff?: Buffer;
  public version = "1";
  public no = 0;
  public user = "";
  public host = "";
  public command = "";
  public extra = "";

  constructor(version: string, no:number, user:string, host:string, command: string, extra:string) {
    this.version = version;
    this.no = no;
    this.user = user;
    this.host = host;
    this.command = command;
    this.extra = extra;
  }

  public static from(buff: Buffer) : IPMPack {
    let verEnd = buff.indexOf(":");
    let version = buff.toString(undefined, 0, verEnd);
    let feiq = version.indexOf("#") != -1;
    let noEnd = buff.indexOf(":", verEnd+1);
    let str = buff.toString(undefined, verEnd+1, noEnd);
    let packetId = Number.parseInt(str);
    let userEnd = buff.indexOf(":", noEnd+1);
    let user = "";
    if(feiq) {
      let userBuff = Buffer.alloc(userEnd - noEnd -1);
      buff.copy(userBuff, 0, noEnd+1, userEnd);
      user = iconv.decode(userBuff, "GBK");
    } else {
      user = buff.toString(undefined, noEnd+1, userEnd);
    }
    let hostEnd = buff.indexOf(":", userEnd+1);
    let host = "";
    if(feiq) {
      let hostBuff = Buffer.alloc(hostEnd - userEnd -1);
      buff.copy(hostBuff, 0, userEnd+1, hostEnd);
      host = iconv.decode(hostBuff, "GBK");
    } else {
      host = buff.toString(undefined, userEnd+1, hostEnd);
    }
    
    let cmdEnd = buff.indexOf(":", hostEnd+1);
    let command = buff.toString(undefined, hostEnd+1, cmdEnd);
    let extra = "";
    if(feiq) {
      let extraBuff = Buffer.alloc(buff.length - cmdEnd+1);
      buff.copy(extraBuff, 0, cmdEnd+1);
      extra = iconv.decode(extraBuff, "GBK");
    } else {
      extra = buff.toString(undefined, cmdEnd+1);
    }
    let newPack = new IPMPack(version, packetId, user, host, command, extra);
    newPack._buff = buff;

    return newPack;  
  }

  public toString() : string {
    let msg = `${this.version}:${this.no}:${this.user}:${this.host}:${this.command}:${this.extra}`
    return msg;
  }
}