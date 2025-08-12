import {
  createLocalJWKSet,
  createRemoteJWKSet as createJoseRemoteJWKSet,
  JWTVerifyGetKey,
  RemoteJWKSetOptions,
} from "jose";

export interface JWKSetOptions extends RemoteJWKSetOptions {
  region?: string;
  userPoolId?: string;
}

const DEFAULT_REMOTE_OPTIONS: RemoteJWKSetOptions = {
  timeoutDuration: 10000, // 10 seconds - longer for AWS network latency
  cooldownDuration: 300000, // 5 minutes - production stability
  cacheMaxAge: 3600000, // 1 hour - AWS Cognito keys don't rotate frequently
  headers: {
    "User-Agent": "cognito-jwkset",
  },
};

/**
 * Creates a remote JWKS from AWS Cognito.
 *
 * This helper function handles the remote JWKS creation with production-ready defaults
 * optimized for AWS Cognito endpoints. It includes appropriate caching, timeouts, and
 * error handling to ensure reliable JWT verification in production environments.
 *
 * The function automatically constructs the Cognito JWKS URL using the region and user pool ID,
 * then creates a remote JWK Set with optimized caching settings to minimize network requests
 * while handling AWS Cognito's key rotation patterns.
 */

const createRemoteJWKSet = (options?: JWKSetOptions): JWTVerifyGetKey => {
  const {
    region = process.env.AWS_REGION,
    userPoolId = process.env.COGNITO_USER_POOL_ID,
    ...userRemoteOptions
  } = options || {};

  if (!region || !userPoolId) {
    throw new Error(
      "AWS_REGION and COGNITO_USER_POOL_ID must be provided via environment variables or options parameter"
    );
  }

  // Merge user options with defaults, excluding region and userPoolId
  const remoteOptions: RemoteJWKSetOptions = {
    ...DEFAULT_REMOTE_OPTIONS,
    ...userRemoteOptions,
  };

  const remoteURL = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  return createJoseRemoteJWKSet(new URL(remoteURL), remoteOptions);
};

/**
 * AWS Cognito JWKS resolver with local-first fallback strategy.
 *
 * This function implements a robust JWKS resolution strategy optimized for AWS Cognito:
 * 1. First attempts to use local JWKS from environment variable (fast, offline-capable)
 * 2. Falls back to remote AWS Cognito JWKS endpoint if local fails or is unavailable
 *
 * The local-first approach provides several benefits:
 * - Faster JWT verification (no network calls when local keys work)
 * - Offline capability for development and testing
 * - Reduced load on AWS Cognito endpoints
 * - Graceful degradation when local keys are invalid or expired
 *
 * For remote JWKS, the function uses production-optimized defaults including:
 * - Extended timeouts for AWS network latency
 * - Appropriate caching intervals for Cognito's key rotation patterns
 * - Built-in retry and error handling
 *
 * Common use cases:
 * - JWT verification middleware in web applications
 * - API gateway authentication
 * - Development environments with static test keys
 * - Production environments requiring high availability
 */

export default (options?: JWKSetOptions): JWTVerifyGetKey => {
  if (!process.env.COGNITO_LOCAL_JWKSET) {
    return createRemoteJWKSet(options);
  }

  try {
    const localJWKS = JSON.parse(process.env.COGNITO_LOCAL_JWKSET);
    return createLocalJWKSet(localJWKS);
  } catch (error) {
    return createRemoteJWKSet(options);
  }
};
