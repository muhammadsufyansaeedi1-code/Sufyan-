const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function getResponse(prompt) {
  const text = (prompt || '').trim();
  if (!text) {
    return {
      status: 'idle',
      text: 'I am ready. Ask me anything.'
    };
  }

  const lower = text.toLowerCase();

  if (lower.includes('time')) {
    return {
      status: 'info',
      text: `The current time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
    };
  }

  if (lower.includes('date')) {
    return {
      status: 'info',
      text: `Today is ${new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`
    };
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return {
      status: 'greeting',
      text: 'Hello, sir. Jarvis is online and ready to assist.'
    };
  }

  if (lower.includes('status')) {
    return {
      status: 'system',
      text: 'Core systems are stable. All key modules are online and ready.'
    };
  }

  if (lower.includes('who are you') || lower.includes('what are you')) {
    return {
      status: 'identity',
      text: 'I am Jarvis, your local AI assistant, built to help with tasks, status updates, and day-to-day commands.'
    };
  }

  if (lower.includes('weather')) {
    return {
      status: 'info',
      text: 'Weather data is not connected in this local build, but I can help you track conditions if you add an API integration.'
    };
  }

  if (lower.includes('open') || lower.includes('launch')) {
    return {
      status: 'command',
      text: 'Opening the requested module now. If you want a specific tool, tell me which one you need.'
    };
  }

  if (lower.includes('help')) {
    return {
      status: 'help',
      text: 'Try asking for the time, date, status, or say hello. I can also respond to commands like open, launch, weather, or system check.'
    };
  }

  return {
    status: 'assistant',
    text: `I understand your request: "${text}". I am running in local demo mode, so I can respond with smart command handling and a Jarvis-style interface.`
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/jarvis') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const reply = getResponse(payload.prompt || '');
        sendJson(res, 200, { ok: true, reply });
      } catch (error) {
        sendJson(res, 400, {
          ok: false,
          error: 'Invalid JSON request body.'
        });
      }
    });

    return;
  }

  let safePath = url.pathname === '/' ? '/index.html' : url.pathname;
  let filePath = path.join(ROOT, 'public', safePath);

  if (!filePath.startsWith(path.join(ROOT, 'public'))) {
    sendJson(res, 403, { ok: false, error: 'Forbidden' });
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        sendJson(res, 404, { ok: false, error: 'Not found' });
      } else {
        sendJson(res, 500, { ok: false, error: 'Server error' });
      }
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Jarvis assistant running at http://localhost:${PORT}`);
});
