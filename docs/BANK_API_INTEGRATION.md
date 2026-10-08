# Bank API Integration Guide

## Overview

This guide explains how to integrate with each Greek bank's Open Banking API to complete the transaction sync implementation.

## OAuth 2.0 Flow

All Greek banks use OAuth 2.0 Authorization Code flow for authentication. The flow consists of:

1. **Authorization Request**: User is redirected to bank's login page
2. **User Authentication**: User enters bank credentials
3. **Authorization Grant**: Bank redirects back with authorization code
4. **Token Exchange**: App exchanges code for access token
5. **API Access**: App uses access token to fetch transactions

## Bank-Specific Integration

### Alpha Bank

**API Documentation**: https://developer.api.alphabank.eu/

**Sandbox URL**: https://sandbox.api.alphabank.eu/

**Key Points**:
- Uses eIDAS certificate (QSealC profile) for production
- Sandbox available for testing without certificate
- Supports PSD2 standard
- Rate limit: 1000 requests/minute

**OAuth Endpoints**:
```
Authorization: https://sandbox.api.alphabank.eu/oauth2/authorize
Token: https://sandbox.api.alphabank.eu/oauth2/token
Revoke: https://sandbox.api.alphabank.eu/oauth2/revoke
```

**Transaction API**:
```
GET /v2/accounts/{accountId}/transactions
Query Parameters:
  - dateFrom: ISO 8601 date
  - dateTo: ISO 8601 date
  - limit: Max 100
  - offset: For pagination
```

**Response Format**:
```json
{
  "transactions": [
    {
      "transactionId": "TXN123",
      "bookingDate": "2026-05-28",
      "valueDate": "2026-05-28",
      "amount": 25.50,
      "currency": "EUR",
      "description": "Payment at merchant",
      "creditorName": "Merchant Name",
      "debtorName": "Your Name"
    }
  ],
  "paging": {
    "pageNumber": 1,
    "pageSize": 100,
    "totalPages": 5
  }
}
```

### Eurobank

**API Documentation**: https://openbanking.eurobank.gr/

**Sandbox URL**: https://sandbox.openbanking.eurobank.gr/

**Key Points**:
- PSD2 compliant
- No additional certificates required for sandbox
- Production requires eIDAS certificate
- Rate limit: 500 requests/minute

**OAuth Endpoints**:
```
Authorization: https://sandbox.openbanking.eurobank.gr/oauth2/authorize
Token: https://sandbox.openbanking.eurobank.gr/oauth2/token
Revoke: https://sandbox.openbanking.eurobank.gr/oauth2/revoke
```

**Transaction API**:
```
GET /api/v1/accounts/{accountId}/transactions
Headers:
  - X-Request-ID: UUID for request tracking
Query Parameters:
  - fromDate: ISO 8601 date
  - toDate: ISO 8601 date
  - limit: Max 100
```

**Response Format**:
```json
{
  "data": [
    {
      "id": "TXN456",
      "bookingDateTime": "2026-05-28T10:30:00Z",
      "valueDateTime": "2026-05-28T10:30:00Z",
      "transactionAmount": {
        "amount": 25.50,
        "currency": "EUR"
      },
      "remittanceInformationUnstructured": "Payment description",
      "creditorName": "Merchant Name"
    }
  ],
  "links": {
    "next": "/api/v1/accounts/123/transactions?offset=100"
  }
}
```

### Piraeus Bank

**API Documentation**: https://rapidlink.piraeusbank.gr/

**Sandbox URL**: https://sandbox-api.piraeusbank.gr/

**Key Points**:
- Uses rAPId Link platform (PSD2 v3.1)
- Most modern API among Greek banks
- Requires API key for sandbox
- Rate limit: 2000 requests/minute

**OAuth Endpoints**:
```
Authorization: https://sandbox-api.piraeusbank.gr/oauth2/authorize
Token: https://sandbox-api.piraeusbank.gr/oauth2/token
Revoke: https://sandbox-api.piraeusbank.gr/oauth2/revoke
```

**Transaction API**:
```
GET /v3.1/accounts/{accountId}/transactions
Headers:
  - X-Request-ID: UUID for request tracking
  - Authorization: Bearer {accessToken}
Query Parameters:
  - bookingDateFrom: ISO 8601 date
  - bookingDateTo: ISO 8601 date
  - limit: Max 100
```

**Response Format**:
```json
{
  "transactions": [
    {
      "transactionId": "TXN789",
      "bookingDate": "2026-05-28",
      "valueDate": "2026-05-28",
      "transactionAmount": {
        "amount": 25.50,
        "currency": "EUR"
      },
      "remittanceInformationUnstructured": "Payment description",
      "counterpartyName": "Merchant Name"
    }
  ],
  "paging": {
    "pageNumber": 1,
    "pageSize": 100,
    "totalPages": 3
  }
}
```

### National Bank of Greece

**API Documentation**: https://www.nbg.gr/en/the-group/organisation/technology/open-banking

**Sandbox URL**: https://sandbox.nbg.gr/

**Key Points**:
- PSD2 compliant
- Supports multiple account types
- Production requires eIDAS certificate
- Rate limit: 1000 requests/minute

**OAuth Endpoints**:
```
Authorization: https://sandbox.nbg.gr/oauth2/authorize
Token: https://sandbox.nbg.gr/oauth2/token
Revoke: https://sandbox.nbg.gr/oauth2/revoke
```

**Transaction API**:
```
GET /api/v1/accounts/{accountId}/transactions
Headers:
  - X-Request-ID: UUID for request tracking
Query Parameters:
  - fromDate: ISO 8601 date
  - toDate: ISO 8601 date
  - limit: Max 100
```

**Response Format**:
```json
{
  "transactions": [
    {
      "id": "TXN999",
      "date": "2026-05-28",
      "amount": 25.50,
      "currency": "EUR",
      "description": "Payment description",
      "merchant": "Merchant Name",
      "status": "COMPLETED"
    }
  ],
  "meta": {
    "total": 250,
    "page": 1,
    "perPage": 100
  }
}
```

## Implementation Steps

### 1. Register with Bank

Contact each bank's developer program to:
- Register your application
- Get OAuth client ID and secret
- Set up sandbox account
- Get API documentation

### 2. Create Bank Adapter

Create a bank-specific adapter to handle API differences:

```typescript
// lib/bank-adapters/alpha-bank.ts
export class AlphaBankAdapter {
  constructor(private clientId: string, private clientSecret: string) {}

  getAuthorizationUrl(state: string): string {
    return `https://sandbox.api.alphabank.eu/oauth2/authorize?...`;
  }

  async exchangeCode(code: string): Promise<TokenResponse> {
    // Exchange authorization code for tokens
  }

  async fetchTransactions(accessToken: string, accountId: string): Promise<Transaction[]> {
    // Fetch and map transactions to app format
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    // Refresh access token
  }

  async revokeToken(accessToken: string): Promise<void> {
    // Revoke access token
  }
}
```

### 3. Implement OAuth Handler

Create endpoint to handle OAuth redirect:

```typescript
// server/oauth-handler.ts
export async function handleOAuthCallback(req: Request) {
  const { code, state, error } = req.query;

  // Verify state token
  const stateRecord = await db.bankOAuthState.get(state);
  if (!stateRecord) throw new Error('Invalid state token');

  // Get bank adapter
  const adapter = getBankAdapter(stateRecord.bankId);

  // Exchange code for tokens
  const tokens = await adapter.exchangeCode(code);

  // Save connection
  await db.bankConnections.create({
    userId: stateRecord.userId,
    bankId: stateRecord.bankId,
    oauthAccessToken: encrypt(tokens.accessToken),
    oauthRefreshToken: encrypt(tokens.refreshToken),
    oauthTokenExpiry: tokens.expiresAt,
  });

  // Mark state as used
  await db.bankOAuthState.markAsUsed(state);

  return { success: true };
}
```

### 4. Implement Transaction Sync

Create sync function for each bank:

```typescript
// lib/bank-sync/alpha-bank-sync.ts
export async function syncAlphaBankTransactions(connection: BankConnection) {
  const adapter = new AlphaBankAdapter(clientId, clientSecret);

  // Refresh token if needed
  if (isTokenExpired(connection.oauthTokenExpiry)) {
    const newTokens = await adapter.refreshToken(
      decrypt(connection.oauthRefreshToken)
    );
    await db.bankConnections.update(connection.id, {
      oauthAccessToken: encrypt(newTokens.accessToken),
      oauthTokenExpiry: newTokens.expiresAt,
    });
  }

  // Fetch transactions
  const transactions = await adapter.fetchTransactions(
    decrypt(connection.oauthAccessToken),
    connection.accountId
  );

  // Import transactions
  let imported = 0;
  let duplicates = 0;

  for (const txn of transactions) {
    // Check for duplicates
    const existing = await db.bankTransactions.getByExternalId(
      connection.id,
      txn.transactionId
    );

    if (existing) {
      duplicates++;
      continue;
    }

    // Create transaction
    await db.bankTransactions.create({
      bankConnectionId: connection.id,
      externalTransactionId: txn.transactionId,
      amount: txn.amount,
      currency: txn.currency,
      description: txn.description,
      merchantName: txn.creditorName,
      transactionDate: txn.bookingDate,
    });

    imported++;
  }

  // Log sync
  await db.bankSyncLogs.create({
    bankConnectionId: connection.id,
    syncType: 'startup',
    status: 'success',
    transactionsCount: transactions.length,
    newTransactionsCount: imported,
    duplicatesSkipped: duplicates,
  });

  return { imported, duplicates };
}
```

### 5. Testing

Test each bank integration:

```typescript
// Test OAuth flow
describe('Alpha Bank OAuth', () => {
  it('should generate correct authorization URL', () => {
    const adapter = new AlphaBankAdapter(clientId, clientSecret);
    const url = adapter.getAuthorizationUrl('state123');
    expect(url).toContain('sandbox.api.alphabank.eu');
  });

  it('should exchange code for tokens', async () => {
    const tokens = await adapter.exchangeCode('auth_code_123');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });
});

// Test transaction sync
describe('Alpha Bank Sync', () => {
  it('should fetch and import transactions', async () => {
    const result = await syncAlphaBankTransactions(connection);
    expect(result.imported).toBeGreaterThan(0);
  });

  it('should skip duplicate transactions', async () => {
    const result = await syncAlphaBankTransactions(connection);
    expect(result.duplicates).toBeGreaterThanOrEqual(0);
  });
});
```

## Error Handling

Handle bank-specific errors:

```typescript
async function handleBankError(error: any, bankId: string) {
  if (error.code === 'INVALID_TOKEN') {
    // Token expired, refresh it
    return 'token_expired';
  } else if (error.code === 'RATE_LIMITED') {
    // Too many requests, retry later
    return 'rate_limited';
  } else if (error.code === 'ACCOUNT_LOCKED') {
    // User account locked, notify user
    return 'account_locked';
  } else if (error.code === 'NETWORK_ERROR') {
    // Network issue, retry
    return 'network_error';
  }
  
  // Log unknown error
  console.error(`Bank ${bankId} error:`, error);
  return 'unknown_error';
}
```

## Production Deployment

Before deploying to production:

1. **Get eIDAS Certificates**
   - Contact each bank for certificate requirements
   - Obtain QSealC certificate for production

2. **Update Endpoints**
   - Switch from sandbox to production URLs
   - Update client credentials

3. **Enable Monitoring**
   - Set up error tracking
   - Monitor sync performance
   - Track API response times

4. **Security Review**
   - Audit token storage
   - Review error handling
   - Test security scenarios

5. **Load Testing**
   - Test with multiple users
   - Monitor API rate limits
   - Optimize sync performance

## References

- [Open Banking PSD2 Standard](https://www.openbanking.org.uk/)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [PSD2 Regulatory Technical Standards](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32015R0751)
