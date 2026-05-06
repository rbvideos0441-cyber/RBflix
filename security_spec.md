# Security Specification for StreamNexus

## Data Invariants
1. A profile cannot exist without belonging to a valid User ID.
2. Users can only read/write their own profiles, watch history, and favorites.
3. Movies and Series are read-only for public users (authenticated).
4. Subscription status and plan can only be updated by a system process (simulated as admin for now).
5. Watch history progress must be a non-negative number and less than or equal to total duration.

## The "Dirty Dozen" Payloads (Red Team Tests)
1. **Identity Spoofing**: Attempt to create a profile under another user's UID.
2. **Profile Hijacking**: Attempt to update another user's profile details.
3. **Ghost Profile**: Create a profile without a name or avatar.
4. **Unauthorized Movie Write**: Attempt to update a movie's HLS URL as a non-admin.
5. **Unauthorized Series Write**: Attempt to create a new series collection.
6. **Watch History Poisoning**: Set `progressSeconds` to 9999999 for a 100s movie.
7. **Negative Progress**: Set `progressSeconds` to -50.
8. **Shadow List Query**: Query all `watchHistory` records across all users.
9. **Admin Profile Creation**: Attempt to set `isAdmin: true` in a user profile (if it existed).
10. **Plan Hijacking**: Attempt to update `subscriptionPlan` to 'premium' directly via client SDK.
11. **Favorite Injection**: Add a movie to another user's favorites list.
12. **System Field Injection**: Attempt to overwrite `createdAt` with a backdated timestamp.

## The Test Runner
A `firestore.rules.test.ts` will be implemented to verify these constraints.
