import { MyBuffer } from "./MyBuffer"

export class MyFileData {
  private _buff: MyBuffer = new MyBuffer();
  private headerSize: number = -1;
  private name: string = "";
  private size: number = -1;
  private attr: number = -1;

  public isReady() : boolean {
    let buff = this._buff.toBuffer();
    if(this.headerSize != -1) {
      if(buff.length >= this.headerSize) {
        return true;
      } else {
        return false;
      }
    } else {
      let headerSizeEnd = buff.indexOf(0x3a)
      if(headerSizeEnd != -1) {
        let strHeaderSize = buff.toString(undefined, 0, headerSizeEnd);
        this.headerSize = Number.parseInt(strHeaderSize, 16);
      }
      return false;
    }
  }
}
