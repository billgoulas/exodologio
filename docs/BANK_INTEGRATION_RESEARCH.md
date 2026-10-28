# Open Banking Integration Research

## Greek Banks Open Banking APIs

### 1. Alpha Bank
**Portal:** https://developer.api.alphabank.eu/

**Authentication:**
- OAuth2 compliant
- Requires eIDAS certificate (QSealC profile)
- JWS (JSON Web Signature) for request signing
- RS256 algorithm for asymmetric signing

**Key Requirements:**
- Must upload eIDAS certificate to developer portal
- Certificate must be manually approved by internal process
- JWS signature required for all requests (optional in Sandbox)
- Supports AISP (Account Information Service Provider)
- Supports PISP (Payment Initiation Service Provider)

**API Products:**
- Account Information (AIS)
- Payment Initiation (PIS)
- Funds Confirmation

**Documentation:**
- OpenAPI Specification available (PDF/YAML)
- Sandbox environment available for testing

---

### 2. Eurobank
**Portal:** https://openbanking.eurobank.gr/

**Key Features:**
- Free to join and explore APIs
- Sign-up process available
- Three main API products:
  1. **Account Product** - Accounts, card information, transactions
  2. **Payment Product** - Domestic/cross-border payments, card payments, bill payments
  3. **Funds Confirmation Product** - Confirms funds availability

**Authentication:**
- OAuth2 based
- Redirect-based authentication flow (typical for Greek banks)

**Status:** Actively maintained and updated

---

### 3. Piraeus Bank
**Portal:** https://rapidlink.piraeusbank.gr/

**Key Features:**
- Free developer account
- Multiple API products available
- Recent updates (2026):
  - PSD2 PIS v3.1 released
  - PSD2 AIS v3.1 released
  - Verification of Payee (VoP) feature

**API Products:**
- **PB API Accounts v1.2** - Account information and transactions
- **PB API Payments v1.2** - Bill payments
- **PB API Cards v1.2** - Card information and administration
- **PSD2 APIs** - Latest versions (AIS v3.1, PIS v3.1)

**Authentication:**
- OAuth2 based
- Separate endpoints for Development and Production
- Refresh token support

**Documentation:**
- Getting Started guide
- Technical documentation
- FAQ section with common issues
- Sandbox environment for testing

---

### 4. National Bank of Greece
**Status:** Open Banking API available (via PSD2)
- Supports Account Information Services (AIS)
- Supports Payment Initiation Services (PIS)
- Follows PSD2 standards

---

## Common PSD2 Standards

All Greek banks follow **PSD2 (Payment Services Directive 2)** which requires:

1. **Strong Customer Authentication (SCA)**
2. **Secure Communication** - TLS 1.2+
3. **API Standardization** - Berlin Group XS2A standard
4. **Redirect-based Flow** - User redirected to bank for authentication
5. **OAuth2 Authorization** - Standard OAuth2 flow

---

## Recommended Implementation Approach

### Phase 1: Backend Setup
1. Create OAuth2 endpoints for each bank
2. Implement secure token storage (encrypted)
3. Create transaction sync service
4. Handle bank-specific authentication requirements

### Phase 2: Mobile App Integration
1. Add "Connect Bank" button in Settings
2. Implement OAuth flow with redirect
3. Store connection tokens securely
4. Implement automatic sync on app startup

### Phase 3: Transaction Sync
1. Fetch transactions from connected banks
2. Map bank transactions to app format
3. Merge with existing local transactions
4. Handle duplicates and conflicts

---

## Security Considerations

1. **Token Storage:**
   - Store OAuth tokens in encrypted database
   - Use secure token refresh mechanism
   - Implement token expiration handling

2. **Certificate Management (Alpha Bank):**
   - Securely store eIDAS certificates
   - Implement certificate rotation
   - Handle certificate expiration

3. **User Data:**
   - Encrypt sensitive bank data
   - Implement proper access controls
   - Comply with GDPR requirements

---

## Next Steps

1. ✅ Research complete
2. Design database schema for bank connections
3. Implement backend OAuth endpoints
4. Create secure token storage
5. Build mobile UI for bank connection
6. Implement transaction sync service
7. Add error handling and retry logic
8. Write comprehensive tests
