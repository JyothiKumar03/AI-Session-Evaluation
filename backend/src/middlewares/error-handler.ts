import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";

export const error_handler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error("[error]", message);
  res.status(500).json({ success: false, error: message });
};
