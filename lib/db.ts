import { Pool, QueryResult, QueryResultRow } from 'pg'

// Build-safe: allow building without DATABASE_URL (Docker builds)
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
    console.warn('[DB] WARNING: DATABASE_URL not set. Using fallback connection string.')
}

// Create connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:VoidCollectorDB2024!@localhost:5432/void_collector',
    ssl: false, // Local connection, no SSL needed
    max: 10, // Maximum connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
})

// Test connection on startup
pool.on('connect', () => {
    console.log('[DB] Connected to PostgreSQL')
})

pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client', err)
})

// Query helper with typing
export async function query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
): Promise<QueryResult<T>> {
    const start = Date.now()
    try {
        const result = await pool.query<T>(text, params)
        const duration = Date.now() - start
        if (process.env.NODE_ENV === 'development') {
            console.log('[DB] Query executed', { text: text.substring(0, 50), duration, rows: result.rowCount })
        }
        return result
    } catch (error) {
        console.error('[DB] Query error:', error)
        throw error
    }
}

// Get single row or null
export async function queryOne<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
): Promise<T | null> {
    const result = await query<T>(text, params)
    return result.rows[0] || null
}

// Execute and return affected rows count
export async function execute(
    text: string,
    params?: any[]
): Promise<number> {
    const result = await query(text, params)
    return result.rowCount || 0
}

// Transaction helper
export async function transaction<T>(
    callback: (client: any) => Promise<T>
): Promise<T> {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const result = await callback(client)
        await client.query('COMMIT')
        return result
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

export default pool
