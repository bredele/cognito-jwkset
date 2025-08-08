# cognito-jwkset

Create a set of cryptographic keys and metadata off your cognito user pool.

## Installation

```sh
npm install cognito-jwkset
```

## Usage

```ts
import jwkset from 'cognito-jwkset';

jwkset((keys) => {
  // do something with keys
});
```

## API

`jwkset<T>(callback, options?)`

**Parameters:**

- `callback: (key: JWTVerifyGetKey) => T` - Function that receives the JWK Set key resolver
- `options?: JWKSetOptions` - Optional configuration object

**Options:**

- `region?: string` - AWS region (overrides `AWS_REGION` env var)
- `userPoolId?: string` - Cognito User Pool ID (overrides `COGNITO_USER_POOL_ID` env var)
- `timeoutDuration?: number` - HTTP timeout in ms (default: 10000)
- `cooldownDuration?: number` - Cache cooldown in ms (default: 300000)
- `cacheMaxAge?: number` - Max cache age in ms (default: 3600000)
- `headers?: Record<string, string>` - Custom HTTP headers

**Returns:** `Promise<T>` - Returns whatever the callback returns

**Environment Variables:**

- `COGNITO_LOCAL_JWKSET` - JSON string of local JWKS (optional, used first if available)
- `AWS_REGION` - AWS region for Cognito endpoint
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID
