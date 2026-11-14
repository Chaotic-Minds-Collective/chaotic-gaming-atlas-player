# ATLAS Player Recovery

## Scope

The recovery foundation covers three independently captured asset classes:

- **Player inventory** — a character inventory snapshot associated with a verified player identity.
- **Tames** — a tame snapshot associated with its provider tame ID and verified owner.
- **Ships** — a ship snapshot associated with its provider ship ID and verified owner or tribe.

A normalized loss event is evidence that a loss occurred; it is not a restorable asset snapshot. Recovery requires a snapshot captured before the loss.

## Evidence contract

The provider adapter must translate source-specific data into these canonical fields before evaluation:

- Snapshot: `snapshotId`, `kind`, `assetId`, `ownerId`, `scope`, `capturedAt`, and opaque object `state`.
- Loss event: `eventId`, `eventType`, `assetId`, `ownerId`, `scope`, and `occurredAt`.
- Scope: `clusterId`, `gridId`, and `serverId`.

The initial loss-event mapping is deliberately narrow:

| Recovery type | Required normalized loss event |
| --- | --- |
| Inventory | `player.died` |
| Tame | `tame.died` |
| Ship | `ship.sunk` |

A player death does not prove that inventory was destroyed or dropped. The adapter or reviewer must verify that the inventory loss actually occurred. Missing owner, asset, timestamp, or scope evidence must not be guessed.

## Workflow and safety

1. Capture and retain a complete pre-loss snapshot using a verified server-side source.
2. Create a recovery case referencing one snapshot and one loss event.
3. Evaluate exact asset identity, owner identity, cluster/grid/server scope, event type, and chronology.
4. Require explicit authorized approval before preparing a recovery claim.
5. Pass the stable claim idempotency key to a provider restore adapter.
6. Mark the claim restored only after the provider returns a durable operation receipt.

The pure foundation in `src/recovery.js` validates evidence and prepares a claim. It does **not** persist snapshots or claims, capture game state, authorize a requester, invoke a game command, restore an asset, or guarantee exactly-once provider execution. Durable storage must enforce uniqueness for the claim idempotency key. The provider adapter must support idempotent restore operations or provide a reconciliation strategy before automatic retries are enabled.

## Required verification before live restoration

- Confirm the exact ATLAS server build, loader, SDK, and supported callbacks on an isolated server.
- Prove snapshot capture for inventory, tames, and ships, including ownership and cross-grid scope.
- Prove provider-side restore operations and their side effects for each asset class.
- Test interrupted restores, duplicate requests, stale snapshots, partial restores, and provider timeouts.
- Keep destructive or privileged restoration behind server-side authorization and audit records.

Until those gates pass, this module remains a server-independent policy foundation. It must not be represented as a working live-server restore feature.
