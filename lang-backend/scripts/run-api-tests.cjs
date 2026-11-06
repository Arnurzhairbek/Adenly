const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

async function main() {
  if (process.env.NODE_ENV !== 'test') throw new Error('Use a dedicated test DB and NODE_ENV=test');
  const port = process.env.TEST_PORT || '5051';
  const url = `http://127.0.0.1:${port}`;
  // Refuse to accidentally test a pre-existing process running different code.
  try { await fetch(url + '/health', { signal: AbortSignal.timeout(1000) }); throw new Error(`Test port ${port} is already in use`); }
  catch (err) { if (!err.cause && err.name !== 'TimeoutError') throw err; }
  const log = fs.openSync(path.join(os.tmpdir(), 'adenly-api-test-server.log'), 'w');
  const server = spawn(process.execPath, ['--require', './scripts/test-server-shutdown.cjs', '--require', './scripts/mail-stub.cjs', 'index.js'], {
    cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: port, GROQ_API_KEY:'' }, stdio: ['ignore', log, log]
  });
  let testCode = 1;
  try {
    let ready = false;
    for (let n = 0; n < 60; n++) {
      if (server.exitCode !== null) throw new Error('API exited before readiness; see test server log');
      try { if ((await fetch(url + '/health', {signal: AbortSignal.timeout(1000)})).ok) { ready = true; break; } } catch {}
      await delay(500);
    }
    if (!ready) throw new Error('API readiness timed out');
    const smoke = spawn(process.execPath, ['scripts/api-smoke.cjs'], { env: {...process.env, TEST_API_URL:url}, stdio:'inherit' });
    [testCode] = await once(smoke, 'exit');
    if (testCode === 0) {
      const extended = spawn(process.execPath, ['scripts/api-extended.cjs'], {env:{...process.env,TEST_API_URL:url},stdio:'inherit'});
      [testCode] = await once(extended,'exit');
    }
  } finally {
    if (server.exitCode === null) {
      const exited = once(server, 'exit');server.kill('SIGTERM');
      const result = await Promise.race([exited,delay(5000).then(()=>null)]);
      if (!result) {server.kill('SIGKILL');testCode=1;}
    }
    fs.closeSync(log);
  }
  process.exitCode = testCode === 0 ? 0 : 1;
}
main().catch(err => {console.error(err);process.exitCode=1;});
