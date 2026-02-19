import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { Router } from './router';
import { Request } from './request';
import { Response } from './response';
import { ErrorHandler } from './index';

type Handler = (req: Request, res: Response) => void;
type NextFunction = () => void;
type Middleware = (req: Request, res: Response, next: NextFunction) => void;

export class Application {
  private router: Router;
  private server: http.Server;

  constructor() {
    this.router = new Router();
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const request = new Request(req);
    const response = new Response(res);

    this.router.handle(request, response);
  }

  public get(path: string, handler: Handler): void {
    this.router.get(path, handler);
  }

  public post(path: string, handler: Handler): void {
    this.router.post(path, handler);
  }

  public put(path: string, handler: Handler): void {
    this.router.put(path, handler);
  }

  public delete(path: string, handler: Handler): void {
    this.router.delete(path, handler);
  }

  public patch(path: string, handler: Handler): void {
    this.router.patch(path, handler);
  }

  public use(pathOrHandler: string | Middleware | Router | ErrorHandler, handler?: Middleware | Router | ErrorHandler): void {
    if (pathOrHandler instanceof Router) {
      this.router.use('', pathOrHandler);
    } else if (typeof pathOrHandler === 'string' && handler instanceof Router) {
      this.router.use(pathOrHandler, handler);
    } else if (typeof pathOrHandler === 'string') {
      this.router.use(pathOrHandler, handler as Middleware);
    } else {
      this.router.use(pathOrHandler);
    }
  }

  public static(root: string): void;
  public static(path: string, root: string): void;
  public static(pathOrRoot: string, root?: string): void {
    const mountPath = root ? pathOrRoot : '/';
    const rootDir = root || pathOrRoot;

    this.router.use(mountPath, (req, res, next) => {
      if (req.method !== 'GET') {
        next();
        return;
      }

      // Remove the mount path from req.path to get the relative path
      const relativePath = req.path.startsWith(mountPath) && mountPath !== '/'
        ? req.path.slice(mountPath.length)
        : req.path;

      let filePath = path.join(rootDir, relativePath);

      // If path ends with /, try to serve index.html
      if (filePath.endsWith('/')) {
        filePath = path.join(filePath, 'index.html');
      }

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          next();
          return;
        }

        const ext = path.extname(filePath);
        const contentType = this.getContentType(ext);
        res.set('Content-Type', contentType);

        const stream = fs.createReadStream(filePath);
        stream.on('error', (streamErr) => {
          next();
        });
        stream.pipe(res.nativeResponse);
      });
    });
  }

  private getContentType(ext: string): string {
    const types: { [key: string]: string } = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };
    return types[ext] || 'text/plain';
  }

  public listen(port: number, callback?: () => void): void {
    this.server.listen(port, callback);
  }
}
