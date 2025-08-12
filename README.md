# cognito-jwkset

Create a set of cryptographic keys and metadata off your cognito user pool.

## Installation

```sh
npm install cognito-jwkset
```

## Usage

```ts
import jwkset from 'cognito-jwkset';

const keys = jwkset();
// Use keys for JWT verification
```

### With options

```ts
import jwkset from 'cognito-jwkset';

const keys = jwkset({
  region: 'us-east-1',
  userPoolId: 'us-east-1_xxxxxxxxx'
});
```

### JWT Verification Example

```ts
import jwkset from 'cognito-jwkset';
import { jwtVerify } from 'jose';

const keys = jwkset();
const { payload } = await jwtVerify(token, keys);
```

## API

`jwkset(options?): JWTVerifyGetKey`

**Parameters:**

- `options?: JWKSetOptions` - Optional configuration object

**Options:**

- `region?: string` - AWS region (overrides `AWS_REGION` env var)
- `userPoolId?: string` - Cognito User Pool ID (overrides `COGNITO_USER_POOL_ID` env var)
- `timeoutDuration?: number` - HTTP timeout in ms (default: 10000)
- `cooldownDuration?: number` - Cache cooldown in ms (default: 300000)
- `cacheMaxAge?: number` - Max cache age in ms (default: 3600000)
- `headers?: Record<string, string>` - Custom HTTP headers

**Returns:** `JWTVerifyGetKey` - A function that can resolve cryptographic keys for JWT verification

**Environment Variables:**

- `COGNITO_LOCAL_JWKSET` - JSON string of local JWKS (optional, used first if available)
- `AWS_REGION` - AWS region for Cognito endpoint
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID
