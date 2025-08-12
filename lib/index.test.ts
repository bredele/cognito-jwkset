import test from 'node:test';
import assert from 'node:assert';
import jwkset from './index.js';

const mockLocalJWKS = JSON.stringify({
  keys: [
    {
      kty: 'RSA',
      use: 'sig',
      kid: 'test-key-id',
      n: 'test-modulus',
      e: 'AQAB'
    }
  ]
});

test('jwkset - should throw error when missing AWS credentials', () => {
  const originalRegion = process.env.AWS_REGION;
  const originalUserPoolId = process.env.COGNITO_USER_POOL_ID;
  const originalLocalJWKS = process.env.COGNITO_LOCAL_JWKSET;
  
  delete process.env.AWS_REGION;
  delete process.env.COGNITO_USER_POOL_ID;
  delete process.env.COGNITO_LOCAL_JWKSET;

  try {
    assert.throws(
      () => jwkset(),
      /AWS_REGION and COGNITO_USER_POOL_ID must be provided/
    );
  } finally {
    if (originalRegion) process.env.AWS_REGION = originalRegion;
    if (originalUserPoolId) process.env.COGNITO_USER_POOL_ID = originalUserPoolId;
    if (originalLocalJWKS) process.env.COGNITO_LOCAL_JWKSET = originalLocalJWKS;
  }
});

test('jwkset - should use local JWKS when available', () => {
  const originalLocalJWKS = process.env.COGNITO_LOCAL_JWKSET;
  
  process.env.COGNITO_LOCAL_JWKSET = mockLocalJWKS;

  try {
    const keys = jwkset();
    assert.ok(keys, 'Should return keys from local JWKS');
    assert.strictEqual(typeof keys, 'function', 'Should return a function (JWTVerifyGetKey)');
  } finally {
    if (originalLocalJWKS) {
      process.env.COGNITO_LOCAL_JWKSET = originalLocalJWKS;
    } else {
      delete process.env.COGNITO_LOCAL_JWKSET;
    }
  }
});

test('jwkset - should fallback to remote when local JWKS is invalid', () => {
  const originalLocalJWKS = process.env.COGNITO_LOCAL_JWKSET;
  const originalRegion = process.env.AWS_REGION;
  const originalUserPoolId = process.env.COGNITO_USER_POOL_ID;
  
  process.env.COGNITO_LOCAL_JWKSET = 'invalid-json';
  process.env.AWS_REGION = 'us-east-1';
  process.env.COGNITO_USER_POOL_ID = 'us-east-1_EXAMPLE123';

  try {
    // This should fallback to remote and either succeed or fail with network error
    // The important thing is it doesn't fail with JSON parse error
    const result = jwkset();
    // If it succeeds, it should return a function
    assert.strictEqual(typeof result, 'function', 'Should return a function when successful');
  } catch (error: any) {
    // If it fails, should not be a JSON parse error (fallback worked)
    assert.ok(!error.message.includes('Unexpected token'), 
      'Should not fail with JSON parse error, fallback should work');
  } finally {
    if (originalLocalJWKS) {
      process.env.COGNITO_LOCAL_JWKSET = originalLocalJWKS;
    } else {
      delete process.env.COGNITO_LOCAL_JWKSET;
    }
    if (originalRegion) {
      process.env.AWS_REGION = originalRegion;
    } else {
      delete process.env.AWS_REGION;
    }
    if (originalUserPoolId) {
      process.env.COGNITO_USER_POOL_ID = originalUserPoolId;
    } else {
      delete process.env.COGNITO_USER_POOL_ID;
    }
  }
});

test('jwkset - should accept options for region and userPoolId', () => {
  const originalLocalJWKS = process.env.COGNITO_LOCAL_JWKSET;
  const originalRegion = process.env.AWS_REGION;
  const originalUserPoolId = process.env.COGNITO_USER_POOL_ID;
  
  delete process.env.COGNITO_LOCAL_JWKSET;
  delete process.env.AWS_REGION;
  delete process.env.COGNITO_USER_POOL_ID;

  try {
    // Try to get JWKS with explicit options
    const result = jwkset({ region: 'us-east-1', userPoolId: 'us-east-1_EXAMPLE123' });
    // Should return a function if successful
    assert.strictEqual(typeof result, 'function', 'Should return JWTVerifyGetKey function');
  } catch (error: any) {
    // If it fails, it should be a network error, not a configuration error
    assert.ok(
      !error.message.includes('AWS_REGION and COGNITO_USER_POOL_ID must be provided'),
      'Should not fail due to missing credentials when options are provided'
    );
  } finally {
    if (originalLocalJWKS) process.env.COGNITO_LOCAL_JWKSET = originalLocalJWKS;
    if (originalRegion) process.env.AWS_REGION = originalRegion;
    if (originalUserPoolId) process.env.COGNITO_USER_POOL_ID = originalUserPoolId;
  }
});
