import crypto from "node:crypto";
import { authenticateStaff } from "../src/lib/staffCredentials.js";

const COOKIE_NAME = "mirchi_session";
const MAX_AGE_SEC = 60 * 60 * 12;
const SECRET = process.env.MIRCHI_AUTH_SECRET || "mirchi360-session-secret-change-in-production";

function signPayload(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload?.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    out[trimmed.slice(0, eq)] = decodeURIComponent(trimmed.slice(eq + 1));
  });
  return out;
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  Object.entries(extraHeaders).forEach(([k, v]) => res.setHeader(k, v));
  res.end(payload);
}

function cookieHeader(token, { clear = false } = {}) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  if (clear) {
    return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`;
  }
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${MAX_AGE_SEC}${secure}`;
}

async function handleAuth(req, res) {
  const url = req.url.split("?")[0];

  if (req.method === "POST" && url === "/api/auth/login") {
    const body = await readJsonBody(req);
    const result = authenticateStaff(body);
    if (!result.success) {
      sendJson(res, 401, result);
      return true;
    }
    const session = {
      ...result.user,
      sessionId: `sess-${Date.now()}`,
      loginTime: new Date().toISOString(),
      exp: Date.now() + MAX_AGE_SEC * 1000
    };
    sendJson(res, 200, { success: true, user: session }, {
      "Set-Cookie": cookieHeader(signPayload(session))
    });
    return true;
  }

  if (req.method === "GET" && url === "/api/auth/session") {
    const token = parseCookies(req)[COOKIE_NAME];
    const user = verifyToken(token);
    sendJson(res, 200, { success: Boolean(user), user: user || null });
    return true;
  }

  if (req.method === "POST" && url === "/api/auth/logout") {
    sendJson(res, 200, { success: true }, { "Set-Cookie": cookieHeader("", { clear: true }) });
    return true;
  }

  return false;
}

export function mirchiAuthPlugin() {
  return {
    name: "mirchi-auth",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (req.url?.startsWith("/api/auth")) {
            const handled = await handleAuth(req, res);
            if (handled) return;
          }
        } catch (err) {
          sendJson(res, 500, { success: false, message: "Auth service error." });
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (req.url?.startsWith("/api/auth")) {
            const handled = await handleAuth(req, res);
            if (handled) return;
          }
        } catch {
          sendJson(res, 500, { success: false, message: "Auth service error." });
          return;
        }
        next();
      });
    }
  };
}
