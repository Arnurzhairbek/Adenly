// Tests use normal process exit so V8 flushes coverage. Never preloaded in production.
if (process.env.NODE_ENV !== 'test') throw new Error('Test server preload requires NODE_ENV=test');
process.on('SIGTERM', () => process.exit(0));
