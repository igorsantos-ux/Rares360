const { Client } = require('pg');

const config = {
  connectionString: 'postgresql://postgres.auuetzgkqcjzmlrlfkiy:VDWUlnmJXo3BDd9D@aws-0-sa-east-1.pooler.supabase.com:5432/postgres',
};

async function test() {
  const client = new Client(config);
  try {
    console.log('Tentando conectar...');
    await client.connect();
    console.log('Conexão bem sucedida!');
    const res = await client.query('SELECT NOW()');
    console.log('Data do servidor:', res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error('Erro de conexão:', err.message);
    if (err.detail) console.error('Detalhe:', err.detail);
    if (err.hint) console.error('Sugestão:', err.hint);
  }
}

test();
