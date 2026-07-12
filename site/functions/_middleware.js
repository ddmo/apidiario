// HTTP Basic Auth su tutto il sito (www.apidiario.it), incluso /docs.
// Credenziali in Cloudflare Pages → Settings → Environment variables:
//   BASIC_AUTH_USER, BASIC_AUTH_PASS
export async function onRequest(context) {
  const { request, env, next } = context;

  const user = env.BASIC_AUTH_USER;
  const pass = env.BASIC_AUTH_PASS;

  // Se le variabili non sono configurate, non blocca il sito.
  if (!user || !pass) return next();

  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice(6));
    const sep = decoded.indexOf(':');
    const reqUser = decoded.slice(0, sep);
    const reqPass = decoded.slice(sep + 1);
    if (reqUser === user && reqPass === pass) {
      return next();
    }
  }

  return new Response('Autenticazione richiesta.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Apidiario", charset="UTF-8"' },
  });
}
