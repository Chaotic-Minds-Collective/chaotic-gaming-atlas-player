# CG Player — Implementation Plan

## Purpose
Player utilities and progression operating consistently across the ATLAS cluster.

## Feature scope
- Suicide/self-respawn and stuck recovery
- Teleport/travel with permissions, costs, cooldowns and PvP/ship rules
- Command aliases and help
- Tame tracker, ownership, limits and custom spawns
- Skill-tree extensions where hooks permit
- Quest progression and tame-color tokens
- Ship retrieval after sinking with anti-duplication controls

## Dependencies
- Core player identity, scoped permissions and event ingestion
- ATLAS adapter: player/location/inventory/tame/ship/skill callbacks
- Tribes for ownership; Commerce for tokens
- World for safe zones/limits; Adventures for quests

## Data ownership
Core owns identity and permissions. Player owns cooldowns, destinations, recovery requests, tame snapshots, progression and ship-recovery claims. Preserve provider IDs and grid context.

## Milestones
1. Build feature-to-hook capability matrix
2. Implement commands/help with fake adapter
3. Add recovery only after respawn/location callbacks verified
4. Add grid-aware teleport
5. Add tame features and ship recovery after ownership hooks proven
6. Integrate skill trees and quests behind capability flags

## Technical gates and risks
- Destructive actions require server-authoritative callbacks and idempotency
- Skill-tree changes may require deeper integration/client assets
- Ship recovery requires tested sinking/destruction source

## Shared engineering requirements
- Use authenticated, least-privilege Core APIs; no direct database credentials in plugins.
- Preserve provider identifiers as strings; display names are not identifiers.
- Carry cluster, grid and server context on applicable records/events.
- Use stable event IDs, idempotency keys and correlation IDs.
- Keep network work off game-critical threads; use bounded timeouts, retries and circuit breakers.
- Keep secrets out of source control and separate credentials per server/integration.
- Add unit tests, fake-adapter contract tests and isolated runtime compatibility tests.
- Gate unsupported features behind explicit capabilities; fail closed for privileged actions.
- Do not deploy to production or change live server configuration during repository planning.

## Current readiness
Documentation and planning scaffold. Exact ATLAS server build, loader, SDK, callbacks and feature-specific capabilities require isolated reproducible validation.
