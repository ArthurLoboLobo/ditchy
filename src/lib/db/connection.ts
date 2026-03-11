import { neon } from '@neondatabase/serverless';

// HTTP-mode connection for single queries (faster in serverless — no TCP handshake)
const sql = neon(process.env.DATABASE_URL!);

export { sql };
