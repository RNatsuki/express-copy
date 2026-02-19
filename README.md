# Express Clone in TypeScript

A minimalist web framework clone of Express.js built in TypeScript to understand how web frameworks work internally.

## Features

- Basic routing (GET, POST, PUT, DELETE, PATCH)
- Middleware support with path-specific middlewares
- Route parameters (e.g., `/users/:id`)
- Router mounting for modular routing
- Error handling with custom error middlewares
- Static file serving
- Request body parsing (JSON, URL-encoded, multipart/form-data)
- File upload support
- Response helpers (redirect, sendFile, json)
- Request helpers (req.ip, req.get)
- TypeScript types included

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Run Example

```bash
npm run example
```

Or for development:

```bash
npm run dev
```

## Usage

```typescript
import { Application, Router } from './src/index';

const app = new Application();

// Static files
app.static('./public');

// Global middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Router mounting
const apiRouter = new Router();
apiRouter.get('/users', (req, res) => {
  res.json({ users: ['Alice', 'Bob'] });
});
apiRouter.post('/users', async (req, res) => {
  const body = await req.body;
  res.status(201).json({ created: body });
});
app.use('/api', apiRouter);

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/redirect', (req, res) => {
  res.redirect('/api/users');
});

app.listen(3000, () => {
  console.log('Server running');
});
```

## API

### Application

- `get(path: string, handler: Handler)`: Register GET route
- `post(path: string, handler: Handler)`: Register POST route
- `put(path: string, handler: Handler)`: Register PUT route
- `delete(path: string, handler: Handler)`: Register DELETE route
- `patch(path: string, handler: Handler)`: Register PATCH route
- `use(path: string, router: Router)`: Mount a router
- `use(path: string, handler: Middleware)`: Register middleware
- `use(handler: Middleware | ErrorHandler)`: Register global middleware or error handler
- `static(root: string)`: Serve static files
- `listen(port: number, callback?)`: Start server

### Router

- Same routing and middleware methods as Application
- Can be mounted to an Application

### Request

- `method`: HTTP method
- `path`: Request path
- `headers`: Request headers
- `params`: Route parameters
- `query`: Query parameters
- `body`: Parsed request body (Promise)
- `files`: Uploaded files
- `ip`: Client IP address
- `get(header: string)`: Get header value

### Response

- `status(code: number)`: Set status code
- `set(key: string, value: string)`: Set header
- `send(data: any)`: Send response
- `json(data: any)`: Send JSON response
- `redirect(url: string)`: Redirect to URL
- `sendFile(filePath: string)`: Send file

### Types

- `NextFunction`: Function to call next middleware
- `ErrorHandler`: Error handling middleware

## Architecture

- `Application`: Main app class
- `Router`: Handles routing, middleware, and sub-router mounting
- `Request`: Wrapper for incoming HTTP requests with parsing
- `Response`: Wrapper for HTTP responses

This is a simplified version to demonstrate core concepts. Real Express.js has many more features.
