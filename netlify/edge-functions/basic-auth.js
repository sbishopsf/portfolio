// Gates the whole site behind a password, using a styled login page instead
// of the browser's native Basic Auth prompt. Set BASIC_AUTH_PASSWORD in
// Netlify's site settings (Site configuration -> Environment variables)
// before deploying.
const COOKIE_NAME = "site_auth";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loginPage({ error } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sign in — Steven Bishop</title>
<style>
  :root {
    --bg: #0f1115;
    --bg-alt: #161922;
    --text: #e8eaed;
    --text-dim: #9aa0aa;
    --accent: #6ee7b7;
    --border: #262a35;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .card {
    width: 100%;
    max-width: 340px;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem;
    margin: 1rem;
  }
  h1 {
    font-size: 1.15rem;
    margin: 0 0 1.5rem;
    font-weight: 600;
  }
  label {
    display: block;
    font-size: 0.85rem;
    color: var(--text-dim);
    margin-bottom: 0.4rem;
  }
  input[type="password"] {
    width: 100%;
    padding: 0.65rem 0.75rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text);
    font-size: 1rem;
    margin-bottom: 1.25rem;
  }
  input[type="password"]:focus {
    outline: none;
    border-color: var(--accent);
  }
  button {
    width: 100%;
    padding: 0.7rem;
    background: var(--accent);
    color: #0f1115;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }
  button:hover { opacity: 0.9; }
  .error {
    color: #f87171;
    font-size: 0.85rem;
    margin: -1rem 0 1.25rem;
  }
</style>
</head>
<body>
  <form class="card" method="POST">
    <h1>stevenbishop.com</h1>
    ${error ? '<p class="error">Incorrect password. Try again.</p>' : ""}
    <label for="password">Password</label>
    <input type="password" id="password" name="password" autofocus required />
    <button type="submit">Sign in</button>
  </form>
</body>
</html>`;
}

export default async (request, context) => {
  const pass = Netlify.env.get("BASIC_AUTH_PASSWORD");
  const url = new URL(request.url);

  const showLogin = (opts) =>
    new Response(loginPage(opts), {
      status: 401,
      headers: { "content-type": "text/html; charset=utf-8" },
    });

  if (!pass) return showLogin();

  const expectedToken = await sha256Hex(pass);
  const cookies = request.headers.get("cookie") || "";
  const match = cookies.match(new RegExp(`${COOKIE_NAME}=([a-f0-9]+)`));

  if (match && match[1] === expectedToken) {
    return context.next();
  }

  if (request.method === "POST") {
    const form = await request.formData();
    if (form.get("password") === pass) {
      const headers = new Headers({ location: url.pathname });
      headers.append(
        "set-cookie",
        `${COOKIE_NAME}=${expectedToken}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`
      );
      return new Response(null, { status: 302, headers });
    }
    return showLogin({ error: true });
  }

  return showLogin();
};

export const config = { path: "/*" };
