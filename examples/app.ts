import {
  Router,
  Request,
  Response,
  NextFunction,
  ErrorHandler,
  Application,
} from "../src/index";

const app = new Application();

// Static files
app.static("/static", "./public");

// Global middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Error handling middleware
const errorHandler: ErrorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Something went wrong!" });
};
app.use(errorHandler);

// Create a sub-router for API routes
const apiRouter = new Router();

// API middleware
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
  console.log("API middleware");
  next();
});

// API routes
apiRouter.get("/users", (req: Request, res: Response) => {
  return res.json({ users: ["Alice", "Bob", "Charlie"] });
});

apiRouter.get("/users/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ user: { id, name: `User ${id}` } });
});

apiRouter.post("/users", async (req: Request, res: Response) => {
  const body = await req.body;
  res.status(201).json({ message: "User created", data: body });
});

apiRouter.put("/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = await req.body;
  res.json({ message: `User ${id} updated`, data: body });
});

apiRouter.delete("/users/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  return res.status(204).json({ message: `User ${id} deleted` });
});

// Mount the API router
app.use("/api", apiRouter);

app.get("/redirect", (req: Request, res: Response) => {
  res.redirect("/api/users")
});

// Route that throws an error (using middleware)
app.use("/error", (req: Request, res: Response, next: NextFunction) => {
  next(new Error("Test error"));
});

app.post("/upload", async (req: Request, res: Response) => {
  await req.body; // Ensure body is parsed
  const files = Object.keys(req.files);
  res.json({ message: "Files uploaded", files });
});

// Start server
app.listen(3002, () => {
  console.log("Server running on http://localhost:3002");
});
