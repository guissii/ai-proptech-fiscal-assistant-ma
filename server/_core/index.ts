import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { spawn } from "child_process";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  const toWslPath = (winPath: string) => {
    const m = /^([A-Za-z]):\\(.*)$/.exec(winPath);
    if (!m) return winPath.replaceAll("\\", "/");
    const drive = m[1].toLowerCase();
    const rest = m[2].replaceAll("\\", "/");
    return `/mnt/${drive}/${rest}`;
  };

  const runProcess = (cmd: string, args: string[], input: string) =>
    new Promise<{ code: number; stdout: Buffer; stderr: Buffer }>((resolve, reject) => {
      const child = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"] });
      const out: Buffer[] = [];
      const err: Buffer[] = [];
      child.stdout.on("data", (d: Buffer) => out.push(d));
      child.stderr.on("data", (d: Buffer) => err.push(d));
      child.on("error", reject);
      child.on("close", code => resolve({ code: code ?? 1, stdout: Buffer.concat(out), stderr: Buffer.concat(err) }));
      child.stdin.write(input);
      child.stdin.end();
    });

  const shouldTryWsl = (stderrText: string) =>
    /weasyprint|libgobject|pango|gtk|could not import/i.test(stderrText);

  app.post("/api/report/pdf", async (req, res) => {
    try {
      const python = process.env.PYTHON_BIN || "python";
      const scriptPath = path.resolve(process.cwd(), "report", "cli.py");
      const input = JSON.stringify(req.body ?? {});

      let result = await runProcess(python, [scriptPath], input);
      let stderrText = result.stderr.toString("utf-8");

      if (result.code !== 0 && shouldTryWsl(stderrText)) {
        const wslCwd = toWslPath(process.cwd());
        const bashCmd = `cd ${wslCwd} && python3 report/cli.py`;
        result = await runProcess("wsl", ["bash", "-lc", bashCmd], input);
        stderrText = result.stderr.toString("utf-8");
      }

      if (result.code !== 0) {
        res.status(500).json({ error: (stderrText || "PDF generator failed").slice(0, 2000) });
        return;
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="rapport-aqar.pdf"`);
      res.status(200).send(result.stdout);
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message ?? e) });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof URIError) {
      res.status(400).send("Bad Request");
      return;
    }
    next(err);
  });

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
