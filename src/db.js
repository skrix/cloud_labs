import pg from 'pg';

const { Pool } = pg;
const pool = new Pool();

pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
});

export default pool;
