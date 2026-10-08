// Temporary migration runner — applies supabase/migrations + seed to hosted DB.
// Not committed to the app; safe to delete after use.
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const PASSWORD = process.env.BECON_DB_PASSWORD;
if (!PASSWORD) {
  console.error('Set BECON_DB_PASSWORD env var first.');
  process.exit(1);
}

const client = new Client({
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.fwruvpdgzjgcjgkpddqj',
  password: PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('Connected.');

  const migDir = path.join(__dirname, 'supabase', 'migrations');
  const files = fs
    .readdirSync(migDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const f of files) {
    const sql = fs.readFileSync(path.join(migDir, f), 'utf8');
    process.stdout.write(`Applying ${f} ... `);
    await client.query(sql);
    console.log('ok');
  }

  const seedPath = path.join(__dirname, 'supabase', 'seed.sql');
  if (fs.existsSync(seedPath)) {
    process.stdout.write('Applying seed.sql ... ');
    await client.query(fs.readFileSync(seedPath, 'utf8'));
    console.log('ok');
  }

  await client.end();
  console.log('Done.');
}

run().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
