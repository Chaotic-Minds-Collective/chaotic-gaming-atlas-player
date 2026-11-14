import test from "node:test";
import assert from "node:assert/strict";
import {
  completeRecoveryClaim,
  createRecoveryCase,
  createRecoveryClaim,
  evaluateRecoveryEvidence,
  recoveryLossEventTypes
} from "../src/recovery.js";

const scope = { clusterId: "cluster-1", gridId: "grid-a", serverId: "server-1" };

function fixtures(kind = "ship") {
  const lossEventType = recoveryLossEventTypes[kind][0];
  const assetId = `${kind}-42`;
  const ownerId = "player-7";
  const recoveryCase = createRecoveryCase({
    caseId: "case-1",
    kind,
    requesterId: "requester-7",
    ownerId,
    assetId,
    snapshotId: "snapshot-1",
    lossEventId: "event-1",
    scope,
    requestedAt: "2026-11-14T12:00:00.000Z"
  });
  const snapshot = {
    snapshotId: "snapshot-1",
    kind,
    assetId,
    ownerId,
    scope,
    capturedAt: "2026-11-14T11:00:00.000Z",
    state: { opaqueProviderState: true }
  };
  const lossEvent = {
    eventId: "event-1",
    eventType: lossEventType,
    assetId,
    ownerId,
    scope,
    occurredAt: "2026-11-14T11:30:00.000Z"
  };
  return { recoveryCase, snapshot, lossEvent };
}

test("declares the supported loss event for each recovery type", () => {
  assert.deepEqual(recoveryLossEventTypes, {
    inventory: ["player.died"],
    tame: ["tame.died"],
    ship: ["ship.sunk"]
  });
});

for (const kind of ["inventory", "tame", "ship"]) {
  test(`${kind} recovery evidence is eligible when identity, scope, and time match`, () => {
    const data = fixtures(kind);
    assert.deepEqual(evaluateRecoveryEvidence(...Object.values(data)), {
      caseId: "case-1",
      snapshotId: "snapshot-1",
      lossEventId: "event-1",
      eligible: true,
      reasons: []
    });
  });
}

test("rejects a snapshot captured after the loss", () => {
  const data = fixtures();
  data.snapshot.capturedAt = "2026-11-14T11:45:00.000Z";
  assert.ok(evaluateRecoveryEvidence(...Object.values(data)).reasons.includes("snapshot_after_loss"));
});

test("rejects owner, asset, and grid mismatches", () => {
  const data = fixtures("tame");
  data.snapshot.ownerId = "another-player";
  data.lossEvent.assetId = "different-tame";
  data.lossEvent.scope = { ...scope, gridId: "grid-b" };
  const result = evaluateRecoveryEvidence(...Object.values(data));
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.includes("snapshot_owner_mismatch"));
  assert.ok(result.reasons.includes("loss_event_asset_mismatch"));
  assert.ok(result.reasons.includes("loss_event_scope_mismatch"));
});

test("rejects a death event as evidence of a sunk ship", () => {
  const data = fixtures("ship");
  data.lossEvent.eventType = "player.died";
  assert.ok(evaluateRecoveryEvidence(...Object.values(data)).reasons.includes("loss_event_type_unsupported"));
});

test("requires an explicit approval before creating a claim", () => {
  const data = fixtures();
  const evidence = evaluateRecoveryEvidence(...Object.values(data));
  assert.throws(() => createRecoveryClaim({ recoveryCase: data.recoveryCase, evidence }), /approval/);
});

test("creates a stable, scoped claim only after evidence and approval", () => {
  const data = fixtures();
  const evidence = evaluateRecoveryEvidence(...Object.values(data));
  const claim = createRecoveryClaim({
    recoveryCase: data.recoveryCase,
    evidence,
    approval: {
      caseId: data.recoveryCase.caseId,
      approvedBy: "admin-1",
      approvedAt: "2026-11-14T12:05:00.000Z"
    }
  });
  assert.equal(claim.status, "prepared");
  assert.equal(claim.idempotencyKey, "cmg-recovery:v1:4:ship:6:case-1");
  assert.equal(claim.scope.gridId, "grid-a");
});

test("does not allow evidence from a different case to authorize a claim", () => {
  const first = fixtures();
  const second = fixtures();
  const otherCase = createRecoveryCase({
    ...second.recoveryCase,
    caseId: "case-2"
  });
  const evidence = evaluateRecoveryEvidence(...Object.values(first));
  assert.throws(() => createRecoveryClaim({
    recoveryCase: otherCase,
    evidence,
    approval: { caseId: "case-2", approvedBy: "admin-1", approvedAt: "2026-11-14T12:05:00.000Z" }
  }), /does not belong/);
});

test("requires a matching case ID for approval", () => {
  const data = fixtures();
  const evidence = evaluateRecoveryEvidence(...Object.values(data));
  assert.throws(() => createRecoveryClaim({
    recoveryCase: data.recoveryCase,
    evidence,
    approval: { caseId: "other-case", approvedBy: "admin-1", approvedAt: "2026-11-14T12:05:00.000Z" }
  }), /does not match/);
});

test("requires a provider receipt to mark a claim restored", () => {
  const data = fixtures();
  const evidence = evaluateRecoveryEvidence(...Object.values(data));
  const claim = createRecoveryClaim({
    recoveryCase: data.recoveryCase,
    evidence,
    approval: { caseId: "case-1", approvedBy: "admin-1", approvedAt: "2026-11-14T12:05:00.000Z" }
  });
  const restored = completeRecoveryClaim(claim, "provider-operation-9");
  assert.equal(restored.status, "restored");
  assert.equal(completeRecoveryClaim(restored, "provider-operation-9"), restored);
  assert.throws(() => completeRecoveryClaim(restored, "different-operation"), /different provider receipt/);
});
