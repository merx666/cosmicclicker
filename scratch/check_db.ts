import { Pool } from 'pg'
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/cosmicclicker'
})
async function run() {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_click_hour_reset'
  `)
  console.log(res.rows)
  pool.end()
}
run()
