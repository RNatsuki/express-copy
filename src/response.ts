import * as http from "http";

export class Response {
  private res: http.ServerResponse;
  private statusCode: number = 200;
  private headers: { [key: string]: string } = {};

  constructor(res: http.ServerResponse) {
    this.res = res;
  }

  public get nativeResponse(): http.ServerResponse {
    return this.res;
  }

  public status(code: number): Response {
    this.statusCode = code;
    return this;
  }

  public set(key: string, value: string): Response {
    this.headers[key] = value;
    return this;
  }

  public send(data: any): void {
    this.res.writeHead(this.statusCode, this.headers);
    this.res.end(typeof data === "object" ? JSON.stringify(data) : data);
  }

  public json(data: any): void {
    this.set("Content-Type", "application/json");
    this.send(data);
  }

  public redirect(url: string): void {
    this.status(302);
    this.set("Location", url);
    this.send("");
  }

  public sendFile(filePath: string): void {
    // Simple file sending - in a real implementation you'd want more features
    const fs = require("fs");
    const stream = fs.createReadStream(filePath);
    stream.pipe(this.res);
  }
}
