const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function parseEnvPort() {
  const envPath = path.resolve(process.cwd(), '.env');
  let port = '5000';

  if (!fs.existsSync(envPath)) return port;

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^['\"]|['\"]$/g, '');

    if (key === 'PORT' && value) {
      port = value;
      break;
    }
  }

  return port;
}

function freePort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano -p tcp | findstr :${port}`, {
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString();

      const pids = new Set();
      for (const line of output.split(/\r?\n/)) {
        const text = line.trim();
        if (!text) continue;
        const parts = text.split(/\s+/);
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid)) pids.add(pid);
      }

      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`[predev] Killed PID ${pid} on port ${port}`);
        } catch {
          // Ignore process kill failure (already exited, protected, etc.)
        }
      }
    } else {
      try {
        execSync(`lsof -ti tcp:${port} | xargs kill -9`, { stdio: 'ignore' });
        console.log(`[predev] Freed port ${port}`);
      } catch {
        // No process bound to this port.
      }
    }
  } catch {
    // No process bound to this port.
  }
}

const port = parseEnvPort();
freePort(port);
