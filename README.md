# CMG ATLAS Player Plugin

Player utilities and progression operating consistently across the ATLAS cluster.

This Chaotic Minds Gaming (CMG)-specific plugin extends [CMG Core](https://github.com/Chaotic-Minds-Collective/chaotic-minds-gaming-atlas-core) and the [ATLAS integration adapter](https://github.com/Chaotic-Minds-Collective/chaotic-minds-gaming-atlas); it does not replace either foundation.

## Feature scope
- Suicide/self-respawn and stuck recovery
- Teleport/travel with permissions, costs, cooldowns and PvP/ship rules
- Command aliases and help
- Tame tracker, ownership, limits and custom spawns
- Skill-tree extensions where hooks permit
- Quest progression and tame-color tokens
- Ship retrieval after sinking with anti-duplication controls

## Architecture and dependencies
- Core player identity, scoped permissions and event ingestion
- ATLAS adapter: player/location/inventory/tame/ship/skill callbacks
- Tribes for ownership; Commerce for tokens
- World for safe zones/limits; Adventures for quests

Core remains authoritative for shared identity, authorization and platform records. ATLAS-native calls pass through the shared adapter. This module owns its domain state and must not connect directly to PostgreSQL.

## Implementation plan
See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for data ownership, milestones and technical gates.

## Readiness
Planning scaffold only. Native ATLAS compatibility and feature-specific callbacks are not yet verified on an isolated server. No production deployment is implied.
