// Tofu: this file is Tofu's addition, used by src/lib/prisma.ts (see TOFU.md).
import { rootCertificates } from 'node:tls'
import type { PoolConfig } from 'pg'

// The connection-string parameters node-postgres takes its TLS settings from.
// Any of them in the URL replaces an `ssl` object passed beside it.
const URL_TLS_PARAMETERS = [
  'ssl',
  'sslmode',
  'sslcert',
  'sslkey',
  'sslrootcert',
  'uselibpqcompat',
]

/**
 * The pool configuration the app's queries use: POSTGRES_PRISMA_URL, as
 * upstream, or DATABASE_URL — which a database Tofu manages supplies — when it
 * is unset or blank.
 *
 * Tofu's DATABASE_URL carries `sslmode=require`, which node-postgres reads as
 * full verification, and the database's certificate chains to a root Node does
 * not ship (Tofu supplies it as SUPABASE_CA_CERT), so the URL on its own fails
 * with SELF_SIGNED_CERT_IN_CHAIN. When SUPABASE_CA_CERT is set, the URL's own
 * TLS parameters are removed and the server is verified against that root as
 * well as Node's own. Verification is never turned off.
 */
export function databasePoolConfig(): PoolConfig {
  const prismaUrl = process.env['POSTGRES_PRISMA_URL']
  if (prismaUrl?.trim()) return { connectionString: prismaUrl }

  const databaseUrl = process.env['DATABASE_URL']
  const caCert = process.env['SUPABASE_CA_CERT']
  if (!databaseUrl?.trim() || !caCert?.trim())
    return { connectionString: databaseUrl }

  let url: URL
  try {
    url = new URL(databaseUrl.trim())
  } catch {
    // Not the parser's own error, which would carry the URL and its password.
    throw new Error('DATABASE_URL must be a PostgreSQL URL.')
  }
  for (const name of URL_TLS_PARAMETERS) url.searchParams.delete(name)
  return {
    connectionString: url.toString(),
    ssl: { ca: [...rootCertificates, caCert], rejectUnauthorized: true },
  }
}
