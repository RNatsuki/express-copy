import { Request as Request } from "./request";
import { Response } from "./response";
import { ErrorHandler } from "./index";

type Handler = (req: Request, res: Response) => void;
type NextFunction = () => void;
type Middleware = (req: Request, res: Response, next: NextFunction) => void;

interface MiddlewareEntry {
  path?: string;
  handler: Middleware;
}

interface Route {
  method: string;
  path: string;
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];
  private middlewares: MiddlewareEntry[] = [];
  private mountedRouters: { path: string; router: Router }[] = [];
  private errorHandlers: ErrorHandler[] = [];

  constructor() {}

  public get(path: string, handler: Handler): void {
    this.routes.push({ method: "GET", path, handler });
  }

  public post(path: string, handler: Handler): void {
    this.routes.push({ method: "POST", path, handler });
  }

  public put(path: string, handler: Handler): void {
    this.routes.push({ method: "PUT", path, handler });
  }

  public delete(path: string, handler: Handler): void {
    this.routes.push({ method: "DELETE", path, handler });
  }

  public patch(path: string, handler: Handler): void {
    this.routes.push({ method: "PATCH", path, handler });
  }

  public use(path: string, handler: Middleware): void;
  public use(handler: Middleware): void;
  public use(router: Router): void;
  public use(path: string, router: Router): void;
  public use(path: string, handler: Middleware): void;
  public use(handler: Middleware | ErrorHandler): void;
  public use(
    pathOrHandler: string | Middleware | Router | ErrorHandler,
    handler?: Middleware | Router | ErrorHandler,
  ): void {
    if (typeof pathOrHandler === "function" && pathOrHandler.length === 4) {
      // Error handler (4 parameters: err, req, res, next)
      this.errorHandlers.push(pathOrHandler as ErrorHandler);
    } else if (pathOrHandler instanceof Router) {
      this.mountedRouters.push({ path: "", router: pathOrHandler });
    } else if (typeof pathOrHandler === "string" && handler instanceof Router) {
      this.mountedRouters.push({ path: pathOrHandler, router: handler });
    } else if (typeof pathOrHandler === "string") {
      this.middlewares.push({
        path: pathOrHandler,
        handler: handler as Middleware,
      });
    } else {
      this.middlewares.push({ handler: pathOrHandler as Middleware });
    }
  }

  public handle(req: Request, res: Response): void {
    // Check mounted routers first
    for (const mounted of this.mountedRouters) {
      const mountPath = mounted.path;
      if (req.path.startsWith(mountPath)) {
        const originalPath = req.path;
        req.path = req.path.slice(mountPath.length) || "/";
        mounted.router.handle(req, res);
        req.path = originalPath; // Restore
        return;
      }
    }

    const applicableMiddlewares = this.middlewares.filter(
      (m) => !m.path || req.path.startsWith(m.path),
    );
    let middlewareIndex = 0;
    let error: any = null;

    const next = (err?: any) => {
      if (err) {
        error = err;
        handleError(error, req, res);
        return;
      }

      middlewareIndex++;
      if (middlewareIndex < applicableMiddlewares.length) {
        applicableMiddlewares[middlewareIndex].handler(req, res, next);
      } else {
        this.handleRoute(req, res);
      }
    };

    const handleError = (err: any, req: Request, res: Response) => {
      if (this.errorHandlers.length > 0) {
        let errorIndex = 0;
        const errorNext = (err?: any) => {
          if (err) {
            errorIndex++;
            if (errorIndex < this.errorHandlers.length) {
              this.errorHandlers[errorIndex](err, req, res, errorNext);
            } else {
              // Default error response
              res.status(500).json({ error: "Internal Server Error" });
            }
          }
        };
        this.errorHandlers[0](err, req, res, errorNext);
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    };

    if (applicableMiddlewares.length > 0) {
      applicableMiddlewares[0].handler(req, res, next);
    } else {
      this.handleRoute(req, res);
    }
  }

  private handleRoute(req: Request, res: Response): void {
    for (const route of this.routes) {
      if (route.method === req.method) {
        const params = this.matchPath(route.path, req.path);
        if (params) {
          req.params = params;
          route.handler(req, res);
          return;
        }
      }
    }
    res.status(404).send("Not Found");
  }

  private matchPath(
    routePath: string,
    requestPath: string,
  ): { [key: string]: string } | null {
    const routeParts = routePath.split("/");
    const requestParts = requestPath.split("/");

    if (routeParts.length !== requestParts.length) {
      return null;
    }

    const params: { [key: string]: string } = {};

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const requestPart = requestParts[i];

      if (routePart.startsWith(":")) {
        const paramName = routePart.slice(1);
        params[paramName] = requestPart;
      } else if (routePart !== requestPart) {
        return null;
      }
    }

    return params;
  }
}
