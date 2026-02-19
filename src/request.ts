import * as http from 'http';

export class Request {
  public method: string;
  public path: string;
  public headers: http.IncomingHttpHeaders;
  public url: string;
  public params: { [key: string]: string } = {};
  public query: { [key: string]: string };
  public files: { [key: string]: { data: Buffer; filename: string; mimetype: string } } = {};
  private rawBody: Buffer = Buffer.alloc(0);
  private req: http.IncomingMessage;

  constructor(req: http.IncomingMessage) {
    this.req = req;
    this.method = req.method || 'GET';
    this.url = req.url || '/';
    this.headers = req.headers;
    try {
      const parsedUrl = new URL(this.url, `http://${this.headers.host || 'localhost'}`);
      this.path = parsedUrl.pathname;
      this.query = Object.fromEntries(parsedUrl.searchParams);
    } catch {
      this.path = '/';
      this.query = {};
    }
  }

  public get body(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.rawBody.length > 0) {
        this.parseBody(resolve);
        return;
      }
      const chunks: Buffer[] = [];
      this.req.on('data', chunk => chunks.push(chunk));
      this.req.on('end', () => {
        this.rawBody = Buffer.concat(chunks);
        this.parseBody(resolve);
      });
      this.req.on('error', reject);
    });
  }

  private parseBody(resolve: (value: any) => void): void {
    const contentType = this.headers['content-type'] || '';
    const data = this.rawBody.toString();
    if (contentType.includes('application/json')) {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(data);
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(data);
      const obj: { [key: string]: string } = {};
      for (const [key, value] of params) {
        obj[key] = value;
      }
      resolve(obj);
    } else if (contentType.includes('multipart/form-data')) {
      // Basic multipart parsing
      this.parseMultipart(resolve);
    } else {
      resolve(data);
    }
  }

  private parseMultipart(resolve: (value: any) => void): void {
    const boundary = this.getBoundary();
    if (!boundary) {
      resolve({});
      return;
    }
    const parts = this.rawBody.toString().split(`--${boundary}`);
    const fields: { [key: string]: string } = {};
    for (const part of parts) {
      if (part.trim() === '' || part === '--') continue;
      const lines = part.split('\r\n');
      const headerLine = lines[0];
      if (headerLine.includes('Content-Disposition')) {
        const disposition = headerLine.split('; ');
        const nameMatch = disposition.find(d => d.startsWith('name='));
        const filenameMatch = disposition.find(d => d.startsWith('filename='));
        if (nameMatch) {
          const name = nameMatch.split('=')[1].replace(/"/g, '');
          const value = lines.slice(2).join('\r\n').trim();
          if (filenameMatch) {
            const filename = filenameMatch.split('=')[1].replace(/"/g, '');
            const contentType = lines[1].split(': ')[1] || 'application/octet-stream';
            this.files[name] = { data: Buffer.from(value), filename, mimetype: contentType };
          } else {
            fields[name] = value;
          }
        }
      }
    }
    resolve(fields);
  }

  public get ip(): string {
    return (this.req.socket?.remoteAddress ||
            this.req.connection?.remoteAddress ||
            this.headers['x-forwarded-for'] as string ||
            '127.0.0.1').split(',')[0].trim();
  }

  public get(header: string): string | undefined {
    return this.headers[header.toLowerCase()] as string;
  }

  private getBoundary(): string | null {
    const contentType = this.headers['content-type'] || '';
    const match = contentType.match(/boundary=(.+)/);
    return match ? match[1] : null;
  }
}
