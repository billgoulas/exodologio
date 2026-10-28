# Bank Integration Guide

## Overview

The Εξοδολόγιο app supports automatic synchronization of transactions from Greek banks using Open Banking APIs. This feature allows users to connect their bank accounts and automatically import transactions without manual entry.

## Supported Banks

Currently, the following Greek banks are supported:

| Bank | API | Status | OAuth2 |
|------|-----|--------|--------|
| Alpha Bank | Open Banking API | ✅ Active | ✅ Yes |
| Eurobank | Open Banking API | ✅ Active | ✅ Yes |
| Piraeus Bank | rAPId Link (PSD2) | ✅ Active | ✅ Yes |
| National Bank of Greece | Open Banking API | ✅ Active | ✅ Yes |

## Architecture

### Components

1. **Database Schema** (`drizzle/schema.ts`)
   - `bankConnections` - Stores OAuth tokens and connection metadata
   - `bankTransactions` - Stores imported transactions for audit trail
   - `bankSyncLogs` - Tracks sync operations and errors
   - `bankOAuthState` - Manages OAuth state tokens for CSRF protection

2. **Backend APIs** (`server/bank-router.ts`)
   - `bank.listConnections` - Get user's connected banks
   - `bank.createConnection` - Initiate OAuth flow
   - `bank.updateConnection` - Update connection status
   - `bank.disconnectConnection` - Revoke bank access
   - `bank.getTransactions` - Fetch imported transactions
   - `bank.createSyncLog` - Log sync operations

3. **Frontend Components** (`components/bank-connection-section.tsx`)
   - Display connected banks
   - Show available banks for connection
   - Manage bank disconnections
   - Display sync status and last sync time

4. **Sync Service** (`lib/bank-sync-service.ts`)
   - Handles transaction synchronization
   - Manages retry logic with exponential backoff
   - Tracks sync status and progress

5. **Sync Hooks** (`hooks/use-bank-sync.ts`)
   - `useBankSync()` - Automatic sync on app startup
   - `useBankSyncManual()` - Manual sync trigger

## User Flow

### Initial Setup

1. User opens Settings → Bank Connections
2. User taps "Connect Bank"
3. User selects their bank from the list
4. App redirects to bank's OAuth login page
5. User authenticates with their bank credentials
6. Bank redirects back to app with authorization code
7. App exchanges code for OAuth tokens
8. Connection is saved securely in database

### Automatic Sync

1. User opens the app
2. App detects it came to foreground
3. App checks for connected banks
4. For each connected bank:
   - Fetches new transactions since last sync
   - Imports transactions into local database
   - Creates sync log entry
5. UI updates with sync status

### Manual Sync

1. User opens Bank Connections in Settings
2. User taps "Sync Now" button
3. App syncs all connected banks
4. Progress is displayed to user
5. Sync results are shown

## Security Considerations

### OAuth2 Flow

- Uses authorization code flow (most secure)
- CSRF protection via state tokens
- Tokens are stored encrypted in database
- User credentials never transmitted to app

### Token Management

- Access tokens are encrypted before storage
- Refresh tokens are used to obtain new access tokens
- Expired tokens are automatically refreshed
- Tokens can be revoked by user at any time

### Data Privacy

- Transactions are stored locally on device
- Sync logs are kept for audit trail
- Users can disconnect banks at any time
- All data is encrypted at rest

## Implementation Details

### Database Schema

```typescript
// Bank Connections
- id: Primary key
- userId: Foreign key to users
- bankId: Bank identifier (alpha, eurobank, piraeus, national)
- bankName: Display name
- accountNumber: Last 4 digits (masked)
- oauthAccessToken: Encrypted access token
- oauthRefreshToken: Encrypted refresh token
- oauthTokenExpiry: Token expiration time
- syncStatus: active | error | expired
- lastSyncedAt: Last successful sync timestamp
- createdAt: Connection creation time
- updatedAt: Last update time

// Bank Transactions
- id: Primary key
- bankConnectionId: Foreign key
- externalTransactionId: Bank's transaction ID
- amount: Transaction amount
- currency: Currency code
- description: Transaction description
- merchantName: Merchant name
- transactionDate: Transaction date
- importedAt: When imported into app
- status: pending | imported | duplicate

// Bank Sync Logs
- id: Primary key
- bankConnectionId: Foreign key
- syncType: startup | manual | scheduled
- status: success | failed
- transactionsCount: Total transactions fetched
- newTransactionsCount: New transactions imported
- duplicatesSkipped: Duplicates detected
- errorMessage: Error details if failed
- syncDuration: Time taken for sync
- createdAt: Sync timestamp
```

### API Endpoints

#### List Connections
```typescript
GET /trpc/bank.listConnections
Response: BankConnection[]
```

#### Create Connection
```typescript
POST /trpc/bank.createConnection
Body: { bankId: string }
Response: { oauthUrl: string, stateToken: string }
```

#### Update Connection
```typescript
POST /trpc/bank.updateConnection
Body: { 
  bankConnectionId: number,
  oauthCode: string,
  stateToken: string
}
Response: BankConnection
```

#### Disconnect Connection
```typescript
POST /trpc/bank.disconnectConnection
Body: { bankConnectionId: number }
Response: { success: boolean }
```

#### Get Transactions
```typescript
GET /trpc/bank.getTransactions?connectionId=1
Response: BankTransaction[]
```

#### Create Sync Log
```typescript
POST /trpc/bank.createSyncLog
Body: {
  bankConnectionId: number,
  syncType: 'startup' | 'manual',
  status: 'success' | 'failed',
  transactionsCount: number,
  newTransactionsCount: number,
  duplicatesSkipped: number,
  errorMessage?: string
}
Response: SyncLog
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Network Error | No internet connection | Retry when online |
| Invalid Credentials | Wrong bank login | User must re-authenticate |
| Token Expired | OAuth token expired | Refresh token automatically |
| Connection Expired | Bank revoked access | User must reconnect |
| Duplicate Transaction | Transaction already imported | Skip and continue |

### Retry Strategy

- Automatic retry with exponential backoff
- Max 3 retries with delays: 1s, 2s, 4s
- Manual retry available in UI
- Errors are logged for debugging

## Testing

### Unit Tests

```bash
# Run bank sync service tests
pnpm test -- lib/__tests__/bank-sync-service.test.ts

# Run bank connection component tests
pnpm test -- components/__tests__/bank-connection-section.test.tsx

# Run all tests
pnpm test
```

### Test Coverage

- ✅ 20 tests for bank sync service
- ✅ 12 tests for bank connection component
- ✅ 481 total tests passing

### Manual Testing

1. **Connect Bank**
   - Open Settings → Bank Connections
   - Tap "Connect Bank"
   - Select bank and authenticate
   - Verify connection appears in list

2. **Sync Transactions**
   - Close and reopen app
   - Verify sync happens automatically
   - Check transactions are imported

3. **Disconnect Bank**
   - Open Settings → Bank Connections
   - Tap disconnect on connected bank
   - Verify connection is removed

4. **Error Handling**
   - Turn off internet
   - Try to sync
   - Verify error message appears
   - Turn on internet and retry

## Future Enhancements

### Phase 2 Features

1. **More Banks**
   - Add support for more Greek banks
   - Add international bank support

2. **Advanced Sync**
   - Scheduled sync (e.g., every 6 hours)
   - Background sync with push notifications
   - Sync history and detailed logs

3. **Transaction Matching**
   - Auto-categorize imported transactions
   - Detect duplicate transactions
   - Merge with manual transactions

4. **Multi-Account**
   - Support multiple accounts per bank
   - Aggregate transactions across accounts
   - Per-account sync settings

5. **Analytics**
   - Bank transaction analytics
   - Spending patterns from bank data
   - Budget tracking with bank data

## Troubleshooting

### Connection Issues

**Problem**: Can't connect to bank
- Check internet connection
- Try again later (bank API may be down)
- Clear app cache and retry

**Problem**: Authentication fails
- Verify bank credentials are correct
- Check if bank account is active
- Contact bank support

### Sync Issues

**Problem**: Sync takes too long
- Check internet speed
- Try manual sync later
- Check app logs for errors

**Problem**: Transactions not importing
- Verify bank connection is active
- Check if transactions exist in bank
- Try manual sync

### Data Issues

**Problem**: Duplicate transactions
- App automatically detects duplicates
- Duplicates are logged but not imported
- Check sync logs for details

**Problem**: Missing transactions
- Verify bank connection is active
- Check transaction date range
- Try manual sync

## Support

For issues or questions about bank integration:

1. Check the troubleshooting section above
2. Review sync logs in Settings
3. Contact support with sync log details
4. Include bank name and error message

## References

- [Open Banking PSD2 Standard](https://www.openbanking.org.uk/)
- [Alpha Bank API Documentation](https://developer.api.alphabank.eu/)
- [Eurobank Open Banking](https://openbanking.eurobank.gr/)
- [Piraeus Bank rAPId Link](https://rapidlink.piraeusbank.gr/)
- [OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
