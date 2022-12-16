export class WebviewMessage {
  public type = "";
  public remote:any = undefined;
  public packet:any = undefined;
  public extra:any = undefined;

  constructor(type: string, remote:any, packet:any, extra:any) {
    this.type = type;
    this.remote = remote;
    this.packet = packet;
    this.extra = extra;
  }

  public toString() : string {
    let obj = {
      type: this.type,
      remote: this.remote,
      packet: this.packet,
      extra: this.extra
    }
    return JSON.stringify(obj);
  }
}