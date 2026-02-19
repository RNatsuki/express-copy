import { Application } from './application';
import { Router } from './router';
import { Request } from './request';
import { Response } from './response';

export { Application, Router };
export type { Request, Response };

export type NextFunction = (err?: any) => void;
export type ErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => void;
