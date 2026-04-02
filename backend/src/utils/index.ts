import type { ApiResponse } from "../types";

export const ok  = <T>(data: T): ApiResponse<T> => ({ success: true, data });
export const err = (error: string): ApiResponse<never> => ({ success: false, error });
