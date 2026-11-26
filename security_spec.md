# Scripture Atlas Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Ownership & PII Isolation**: `/users/{userId}/private/profile` is readable and writable strictly by `request.auth.uid == userId` with verified email (`request.auth.token.email_verified == true` for writes). No cross-user reads or collection listing are permitted.
2. **Study State Ownership & Bounds**: `/users/{userId}/studyState/main` is readable and writable strictly by `request.auth.uid == userId` where `data.ownerId == request.auth.uid` (immutable after create). Bounded sizes prevent resource exhaustion (`bookmarks <= 500`, `readChapters <= 1189`, `collections <= 50`, `savedGraphs <= 24`, `customEdges <= 250`).
3. **Shared Collections Link Access vs. Anti-Scraping**: `/sharedCollections/{shareId}` allows single-document `get` by link holders, while `list` is strictly constrained to `resource.data.ownerId == request.auth.uid`. Only the owner (`ownerId == request.auth.uid`) with verified email may create, update, or delete, and `ownerId` + `createdAt` + `shareId` remain immutable after creation.
4. **Server Timestamp Integrity**: `createdAt == request.time` on creation and `updatedAt == request.time` on updates across all collections.
5. **Default-Deny Catch-All**: All unspecified paths are explicitly denied (`allow read, write: if false;`).

## 2. "Dirty Dozen" Adversarial Payloads
1. **Cross-User Profile Read**: User B executes `get('/users/userA/private/profile')` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` attempts to write `/users/userA/studyState/main` -> `PERMISSION_DENIED`.
3. **Owner Spoofing on Create**: User B creates `/sharedCollections/abc123` with `ownerId: 'userA'` -> `PERMISSION_DENIED`.
4. **Ghost Shadow Field Injection**: User A creates `/sharedCollections/abc123` adding `"isOfficial": true` -> `PERMISSION_DENIED` via `hasOnly`.
5. **Immutable Owner Mutation on Update**: User A updates `/sharedCollections/abc123` changing `ownerId` -> `PERMISSION_DENIED`.
6. **Client-Forged Timestamp**: User A creates `/users/userA/studyState/main` with `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> `PERMISSION_DENIED`.
7. **Unbounded Bookmark Array Flood**: User A writes `bookmarks` array with 501 items -> `PERMISSION_DENIED`.
8. **Oversized Path Variable Poisoning**: Attacker writes `/sharedCollections/<1500-char-id>` -> `PERMISSION_DENIED` via `isValidId(shareId)`.
9. **Collection Scraping via List**: Signed-in User B calls `list` on `/sharedCollections` without owner filter -> `PERMISSION_DENIED`.
10. **Invalid Translation Enum Injection**: User A sets `preferredTranslation: "INVALID"` -> `PERMISSION_DENIED`.
11. **Oversized Title / Description Poisoning**: User A submits a 5,000-character title on `/sharedCollections/abc123` -> `PERMISSION_DENIED`.
12. **PII Leak in Shared Collection**: Attempting to inject `email` property into `/sharedCollections/abc123` -> `PERMISSION_DENIED` via strict allowlist `hasOnly`.
