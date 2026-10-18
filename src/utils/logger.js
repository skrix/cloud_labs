// Structured logger: one JSON object per line on stdout, so CloudWatch can parse and filter it.

function write(level, message, fields) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...fields,
  };
  console.log(JSON.stringify(entry));
}

function info(message, fields = {}) {
  write('info', message, fields);
}

function error(message, fields = {}) {
  write('error', message, fields);
}

module.exports = { logger: { info, error } };
