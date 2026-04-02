import { neon } from "@neondatabase/serverless";
import { ENV } from "../constants/env";

export const sql = neon(ENV.DATABASE_URL);
