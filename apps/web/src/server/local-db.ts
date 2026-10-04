// Dependency-free, so Playwright's CommonJS config loader can import it too.

/** Whether a connection string points at this machine — the local test
 *  Postgres (docker-compose.yml), never Neon. */
export function isLocalDatabase(connectionString: string): boolean {
  const { hostname } = new URL(connectionString);
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}
