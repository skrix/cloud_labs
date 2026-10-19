const base = {
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  dialect: 'postgres'
};

module.exports = {
  development: base,
  test: {
    ...base,
    database: `${base.database}`,
    logging: false,
  },
  production: {
    ...base,
    logging: false,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
  },
};
