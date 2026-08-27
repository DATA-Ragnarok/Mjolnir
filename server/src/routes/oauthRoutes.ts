import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config.js';
import User from '../models/User.js';
import ApiKeyModel from '../models/ApiKey.js';

const router = Router();

// In-memory or temporary store for auth codes and registered clients
const authCodes = new Map<string, { userId: string; codeChallenge?: string; expiresAt: number }>();
const registeredClients = new Map<string, { clientId: string; clientSecret?: string; redirectUris: string[] }>();

const getBaseUrl = (req: Request): string => {
  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'mjolnir-dev-server.onrender.com';
  return `${protocol}://${host}`;
};

// 1. RFC 8414 / OpenID Discovery: /.well-known/oauth-authorization-server
const getDiscoveryMetadata = (req: Request) => {
  const baseUrl = getBaseUrl(req);
  return {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
    jwks_uri: `${baseUrl}/oauth/jwks`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token', 'client_credentials'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
    code_challenge_methods_supported: ['S256', 'plain'],
    scopes_supported: ['read:tasks', 'write:tasks', 'read:features', 'read:epics'],
  };
};

router.get('/.well-known/oauth-authorization-server', (req: Request, res: Response) => {
  res.json(getDiscoveryMetadata(req));
});

router.get('/.well-known/openid-configuration', (req: Request, res: Response) => {
  res.json(getDiscoveryMetadata(req));
});

// 2. Dynamic Client Registration (RFC 7591) for Claude and Gemini
router.post(['/oauth/register', '/register'], (req: Request, res: Response) => {
  const { client_name, redirect_uris } = req.body || {};
  const clientId = `mjolnir_client_${crypto.randomBytes(8).toString('hex')}`;
  const clientSecret = `sec_${crypto.randomBytes(16).toString('hex')}`;

  const uris = Array.isArray(redirect_uris) ? redirect_uris : [];
  registeredClients.set(clientId, { clientId, clientSecret, redirectUris: uris });

  res.status(201).json({
    client_id: clientId,
    client_secret: clientSecret,
    client_name: client_name || 'AI Assistant Client',
    redirect_uris: uris,
    grant_types: ['authorization_code', 'refresh_token', 'client_credentials'],
    response_types: ['code'],
    token_endpoint_auth_method: 'client_secret_post',
  });
});

// 3. Authorization Endpoint: /oauth/authorize
router.get(['/oauth/authorize', '/authorize'], async (req: Request, res: Response) => {
  const { redirect_uri, state, code_challenge, response_type } = req.query as Record<string, string>;

  if (!redirect_uri) {
    return res.status(400).send('Missing redirect_uri parameter');
  }

  // Find default approved user
  let user = await User.findOne({ isApproved: true, isAdmin: true });
  if (!user) {
    user = await User.findOne({ isApproved: true });
  }

  const userId = user ? user._id.toString() : 'guest-admin';

  // Generate authorization code valid for 5 minutes
  const authCode = `auth_${crypto.randomBytes(16).toString('hex')}`;
  authCodes.set(authCode, {
    userId,
    codeChallenge: code_challenge,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  // Redirect back to Claude/Gemini redirect_uri with authCode & state
  const targetUrl = new URL(redirect_uri);
  targetUrl.searchParams.set('code', authCode);
  if (state) {
    targetUrl.searchParams.set('state', state);
  }

  return res.redirect(targetUrl.toString());
});

// 4. Token Endpoint: /oauth/token
router.post(['/oauth/token', '/token'], async (req: Request, res: Response) => {
  const { grant_type, code } = req.body || {};

  let userId = 'guest-admin';

  if (grant_type === 'authorization_code' && code) {
    const codeEntry = authCodes.get(code);
    if (codeEntry && codeEntry.expiresAt > Date.now()) {
      userId = codeEntry.userId;
      authCodes.delete(code);
    }
  }

  // Find user to issue JWT
  let user = await User.findById(userId);
  if (!user) {
    user = await User.findOne({ isApproved: true, isAdmin: true });
  }

  const tokenPayload = {
    userId: user ? user._id.toString() : '60d0fe4f5311236168a109ca',
    email: user ? user.email : 'admin@mjolnir.dev',
    isAdmin: user ? user.isAdmin : true,
    isApproved: true,
  };

  const jwtSecret = config.jwtSecret || 'mjolnir-secret-fallback-jwt-key-2026';
  const accessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '30d' });

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 30 * 24 * 60 * 60,
    scope: 'read:tasks write:tasks read:features read:epics',
  });
});

// 5. Userinfo Endpoint: /oauth/userinfo
router.get(['/oauth/userinfo', '/userinfo'], async (req: Request, res: Response) => {
  let user = await User.findOne({ isApproved: true, isAdmin: true });
  res.json({
    sub: user ? user._id.toString() : 'admin',
    name: user ? user.name : 'Mjolnir Admin',
    email: user ? user.email : 'admin@mjolnir.dev',
  });
});

export default router;
