const { Client } = require('pg');
const PASSWORD = process.env.BECON_DB_PASSWORD;
const REF = 'fwruvpdgzjgcjgkpddqj';
const regions = [
  'us-east-1','us-east-2','us-west-1','eu-central-1','eu-central-2',
  'eu-west-1','eu-west-2','eu-west-3','ap-southeast-1','ap-southeast-2',
  'ap-south-1','ap-northeast-1','ap-northeast-2','sa-east-1','ca-central-1',
];

async function tryRegion(r) {
  const host = `aws-0-${r}.pooler.supabase.com`;
  const client = new Client({
    host,
    port: 5432,
    user: `postgres.${REF}`,
    password: PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    await client.query('select 1');
    await client.end();
    return host;
  } catch (e) {
    try { await client.end(); } catch {}
    return null;
  }
}

(async () => {
  for (const r of regions) {
    const ok = await tryRegion(r);
    if (ok) {
      console.log('WORKS:' + ok);
      process.exit(0);
    }
  }
  console.log('NONE');
  process.exit(1);
})();
