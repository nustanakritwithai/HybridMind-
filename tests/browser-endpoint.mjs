import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';

// Edge can expose DevToolsActivePort while still writing/locking it on Windows.
// Only retry the owned profile's missing or busy file, with a bounded deadline.
export async function browserEndpoint(portFile, browser, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline && (browser.exitCode === null || browser.exitCode === 0)) {
    try {
      const [port, path] = (await readFile(portFile, 'utf8')).trim().split(/\r?\n/);
      if (/^\d+$/.test(port) && Number(port) > 0 && Number(port) <= 65535 && path?.startsWith('/devtools/browser/')) return [port, path];
    } catch (error) { if (!['ENOENT', 'EBUSY'].includes(error.code)) throw error; }
    await delay(100);
  }
  throw new Error(`Owned browser profile did not provide a readable loopback endpoint within ${timeoutMs}ms (exit ${browser.exitCode}).`);
}
