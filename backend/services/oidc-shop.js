const { Issuer, generators } = require("openid-client");

const OIDC_COOKIE = "oidc_shop";
const COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

function getRedirectUri() {
  return (
    process.env.OIDC_REDIRECT_URI ||
    "http://localhost:3000/auth/oidc/callback"
  );
}

let clientPromise = null;

async function getOidcClient() {
  const issuerUrl = process.env.OIDC_ISSUER;
  const clientId = process.env.OIDC_CLIENT_ID;
  if (!issuerUrl || !clientId) {
    throw new Error(
      "OIDC_ISSUER and OIDC_CLIENT_ID must be set in the environment.",
    );
  }

  if (!clientPromise) {
    const secret = process.env.OIDC_CLIENT_SECRET?.trim();
    clientPromise = Issuer.discover(issuerUrl).then((issuer) => {
      return new issuer.Client({
        client_id: clientId,
        client_secret: secret || undefined,
        redirect_uris: [getRedirectUri()],
        response_types: ["code"],
        ...(secret
          ? {}
          : { token_endpoint_auth_method: "none" }),
      });
    });
  }

  return clientPromise;
}

function isOidcConfigured() {
  return !!(process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID);
}

/**
 * @param {import('express').Response} res
 * @returns {Promise<string>} authorization URL
 */
async function startLogin(res) {
  const client = await getOidcClient();
  const state = generators.state();
  const nonce = generators.nonce();
  const code_verifier = generators.codeVerifier();
  const code_challenge = generators.codeChallenge(code_verifier);

  const payload = JSON.stringify({ state, nonce, code_verifier });
  res.cookie(OIDC_COOKIE, payload, {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_MS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  const scope = process.env.OIDC_SCOPE || "openid profile email";
  return client.authorizationUrl({
    scope,
    state,
    nonce,
    code_challenge,
    code_challenge_method: "S256",
  });
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<import('openid-client').TokenSet>}
 */
async function completeLogin(req, res) {
  const client = await getOidcClient();
  const raw = req.cookies[OIDC_COOKIE];
  if (!raw) {
    throw new Error("Missing OIDC login session (cookie). Start login again.");
  }

  let checks;
  try {
    const { state, nonce, code_verifier } = JSON.parse(raw);
    checks = { state, nonce, code_verifier };
  } catch {
    throw new Error("Invalid OIDC session cookie.");
  }

  const params = client.callbackParams(req);
  const tokenSet = await client.callback(getRedirectUri(), params, checks);
  res.clearCookie(OIDC_COOKIE, { path: "/" });
  return tokenSet;
}

function resetClientCache() {
  clientPromise = null;
}

module.exports = {
  OIDC_COOKIE,
  getOidcClient,
  isOidcConfigured,
  startLogin,
  completeLogin,
  resetClientCache,
};
