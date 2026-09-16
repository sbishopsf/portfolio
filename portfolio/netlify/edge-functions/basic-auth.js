// Gates the whole site behind HTTP Basic Auth using Netlify env vars.
// Set BASIC_AUTH_USER and BASIC_AUTH_PASSWORD in Netlify's site settings
// (Site configuration -> Environment variables) before deploying.
export default async (request, context) => {
  const user = Netlify.env.get("BASIC_AUTH_USER") || "admin";
  const pass = Netlify.env.get("BASIC_AUTH_PASSWORD");

  const challenge = () =>
    new Response("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Restricted"' },
    });

  // Fail closed if no password has been configured yet.
  if (!pass) return challenge();

  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Basic ")) return challenge();

  const decoded = atob(auth.slice("Basic ".length));
  const separatorIndex = decoded.indexOf(":");
  const suppliedUser = decoded.slice(0, separatorIndex);
  const suppliedPass = decoded.slice(separatorIndex + 1);

  if (suppliedUser !== user || suppliedPass !== pass) return challenge();

  return context.next();
};

export const config = { path: "/*" };
