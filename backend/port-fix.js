const { execSync } = require('child_process');

function clearPort(port) {
  // System PIDs that should never be killed (e.g., Windows System process)
  const SKIP_PIDS = new Set(['0', '4']);

  try {
    console.log(`🔍 Checking for processes on port ${port}...`);

    // Use exact match: ":PORT " (space after) to avoid matching :50001, :50000, etc.
    // Filter for LISTENING state only — avoids killing established connections
    let rawOutput;
    try {
      rawOutput = execSync(`netstat -ano`).toString();
    } catch (e) {
      console.log(`✨ Port ${port} is clear (netstat error).`);
      return;
    }

    const pids = new Set();
    const lines = rawOutput.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      // Must contain exact ":PORT " (colon + port + space) and be LISTENING
      if (trimmed.includes(`:${port} `) && trimmed.toUpperCase().includes('LISTENING')) {
        const parts = trimmed.split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && !SKIP_PIDS.has(pid)) {
          pids.add(pid);
        }
      }
    });

    if (pids.size > 0) {
      pids.forEach(pid => {
        console.log(`🚀 Terminating zombie process PID: ${pid} on port ${port}...`);
        try {
          execSync(`taskkill /F /PID ${pid}`);
          console.log(`✅ Terminated PID ${pid}`);
        } catch (e) {
          console.log(`⚠️ Failed to kill PID ${pid} (may have already exited).`);
        }
      });
    } else {
      console.log(`✨ Port ${port} is already clear.`);
    }
  } catch (error) {
    console.log(`✨ Port ${port} is clear.`);
  }
}

// Clear port before nodemon starts the dev server
clearPort(5000);
