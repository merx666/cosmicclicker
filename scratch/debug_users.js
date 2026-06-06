import { query } from '../lib/db.ts'

async function test() {
  try {
    const res = await query('SELECT id, telegram_id, wallet_address, world_id_nullifier, username FROM users LIMIT 10')
    console.log(JSON.stringify(res.rows, null, 2))
  } catch (e) {
    console.error(e)
  }
  process.exit(0)
}

test()
