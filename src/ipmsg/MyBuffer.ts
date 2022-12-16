import * as iconv from "iconv-lite";

export class MyBuffer {
  private buff : Buffer = Buffer.alloc(0);

  public append(content: string | Buffer, encoding?: string) : MyBuffer {
    if(typeof content === "string") {
      let charset = "utf-8";
      if(encoding !== undefined) {
        charset = encoding;
      }
      let contentBuff = iconv.encode(content, charset);
      this.buff = Buffer.concat([this.buff, contentBuff]);  
    } else if(content instanceof Buffer) {
      this.buff = Buffer.concat([this.buff, content]);  
    }
    return this;
  }

  public toBuffer() : Buffer {
    return this.buff;
  }

  public length() : number {
    return this.buff.length;
  }
}