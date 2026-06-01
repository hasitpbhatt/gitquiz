---
name: hasits-plan
description: Use when starting any multi-step task that may trigger context compaction. Persists hierarchical plan tree to .hasit/ so the LLM can resume after compaction without re-asking the user. Do NOT use for single-step or informational queries.
---

# HasIt Plan — Persistent Hierarchical Plan Tree

Maintain a checkpoint directory `.hasit/` at the project root so the LLM survives context compaction without re-asking the user what to do. Plans are **n-level trees** — any step can contain sub-steps sub-steps, e.g. `3.2.4.5`.

## File Tree Structure

```
.hasit/
  .gitignore           # "*" prevents accidental git add (double safety net)
  plan.md              # full tree plan (all levels visible, source of truth)
  plan--1.md           # sub-plan for step 1 (any node, branch or leaf)
  plan--1.1.md         # sub-plan for step 1.1
  plan--1.1.1.md       # sub-plan for step 1.1.1
  plan--2.md           # sub-plan for step 2
  plan--3.md           # sub-plan for step 3
  plan--3.1.md
  plan--3.2.md
  plan--3.2.4.md
  plan--3.2.4.5.md     # deeply nested sub-plan
  state.json           # current path, status, summary (hint, not source of truth)
```

Each step path is dot-separated numbers. The sub-plan file mirrors the path: `plan--<path>.md`. Any node (branch or leaf) can have a sub-plan file — branch files may hold design rationale or context that applies to all children.

On task start, also write `.hasit/.gitignore` containing a single line `*` to prevent accidental commits of checkpoint data even if the root `.gitignore` is missing.

## Workflow

### 1. On Task Start
Create `.hasit/` and write the full tree as `plan.md`. Generate a unique `sessionId` (use a short UUID or timestamp + random suffix) to detect stale checkpoints on resume.

**`plan.md` format:**
```markdown
# Task: Deploy microservice

1. [ ] Set up CI pipeline
     1.1 [ ] Configure GitHub Actions
     1.2 [ ] Add Docker build step
          1.2.1 [ ] Write Dockerfile
          1.2.2 [ ] Set up cache layer
2. [ ] Deploy to staging
     2.1 [ ] Create Helm chart
     2.2 [ ] Configure ingress
3. [ ] Run integration tests
     3.1 [ ] API contract tests
     3.2 [ ] E2E smoke tests
          3.2.1 [ ] Auth flow
          3.2.2 [ ] Payment flow
4. [ ] Production deployment
     4.1 [ ] Canary rollout
     4.2 [ ] Monitor dashboards

Started: 2026-05-31T17:00:00Z
```

**`state.json` format:**
```json
{
  "sessionId": "a1b2c3d4",
  "version": 1,
  "currentPath": "",
  "callIndex": 0,
  "status": "in_progress",
  "task": "Deploy microservice",
  "startedAt": "2026-05-31T17:00:00Z",
  "lastAction": "planned task tree"
}
```

`sessionId` is a unique identifier generated at task start. `version` is an integer incremented on every state update (detects corruption / partial writes). `currentPath` is the dot-path of the deepest completed step, or `""` at the start. It always points to a **leaf** (a step with no sub-steps).

A `callIndex` field in `state.json` tracks the cumulative call count since task start. On every tool call block (one or more parallel tools), increment it. This is used to enforce the **every-5-calls checkpoint rule**.

> **`plan.md` is the source of truth for progress.** `state.json` is a fast-read hint. If they disagree, trust `plan.md` — scan it depth-first for the first `[ ]` leaf.

### 2. Before Each State Transition

1. **Mark the completed step** in `plan.md`:
   ```
   1.2.2 [x] Set up cache layer
   ```
   Change `[ ]` to `[x]`. A parent is implicitly done when all its children are `[x]` — no need to mark the parent itself.

2. **Update `state.json`** — increment `version` and `callIndex`, set `currentPath`:
   ```json
   {
     "sessionId": "a1b2c3d4",
     "version": 14,
     "currentPath": "1.2.2",
     "callIndex": 42,
     "status": "in_progress",
     "task": "Deploy microservice",
     "startedAt": "2026-05-31T17:00:00Z",
     "lastAction": "Set up cache layer — wrote Dockerfile with layer caching"
   }
   ```

3. **Write the next step's sub-plan** to `plan--<nextPath>.md`:
   ```markdown
   # Step 2.1: Create Helm chart
   
   ## Files
   - `deploy/helm/templates/deployment.yaml`
   - `deploy/helm/values.yaml`
   
   ## Actions
   1. Scaffold chart with `helm create`
   2. Set image tag from CI env var
   3. Add resource limits
   
   ## Expected
   - `helm lint` passes
   - Dry-run shows correct manifests
   ```
   Delete the previous sub-plan file (it's done). Keep only current + future ones. Branch nodes may also have sub-plan files — don't delete those until all children are done.

### 3. When Descending Into a Deeper Level

When a step needs sub-steps that weren't in the original plan:
1. Append the sub-tree to `plan.md` under that step with proper indentation
2. Write sub-plan files for each new node (branch and leaf)
3. The `currentPath` stays on the parent until all children are done

Example — after finishing `1.2.2`, you discover `1.2.3` and `1.2.4`. Insert them and **renumber**:
```
1.2 [ ] Add Docker build step
    1.2.1 [x] Write Dockerfile
    1.2.2 [x] Set up cache layer
    1.2.3 [ ] Optimize layer ordering
    1.2.4 [ ] Add security scan
```
Renumbering rule: when inserting between `1.2.2` and `1.2.3`:
- Shift the new block: `1.2.3`, `1.2.4`
- Shift everything after by +N: old `1.2.3` → `1.2.5`
- Rename the corresponding `plan--<path>.md` files to match

If the plan has many levels, you can also start a new top-level section instead of deep-inserting to avoid cascading renumbers — use judgment.

### 4. After Each Tool-Call Block

After every tool-call block (one or more parallel tools):

1. **Increment `callIndex`** in `state.json` by 1.
2. **If `callIndex % 5 == 0`**: perform a full periodic checkpoint (see §5 below).
3. **Otherwise**: just update `callIndex` in `state.json` (no need to rewrite `plan.md` every time).

### 5. On Resume After Compaction

The LLM has lost prior context. Before asking the user anything:

1. **Check session validity**: Read `.hasit/state.json`. If `sessionId` is missing, or if this is a brand-new opencode session (no prior context at all) and `status` is `"in_progress"`, the checkpoint may be stale from a crashed session. Ask the user once: "Found a checkpoint from a previous session (`<task>` at step `<currentPath>`). Resume it or discard?" On discard, delete `.hasit/` and start fresh. On resume, continue below.

2. **Read `.hasit/plan.md`** → understand the full task tree and see which leaves are `[x]`

3. **Read `.hasit/state.json`** → get `currentPath` (last completed leaf) as a hint

4. **Find the next incomplete leaf** in `plan.md` (first `[ ]` in depth-first traversal). If `currentPath` points to a step that is actually `[x]`, trust `plan.md` (source of truth) and move past it even if `state.json` is stale.

5. **Read `.hasit/plan--<nextPath>.md`** → know exactly what to do. If the file does not exist (deleted during cleanup or never written), **reconstruct** the sub-plan from context in `plan.md` (the step description and surrounding tree) and write a new `plan--<nextPath>.md`.

6. Continue from that state without asking the user for further confirmation.

### 5. Periodic Checkpoint (Every 5 Tool Calls)

To survive compaction even between state transitions, checkpoint after every 5 tool-call blocks:

1. **Before the first tool call in a block, check `callIndex`**: if `callIndex % 5 == 0` and `callIndex > 0`, flush state before acting.
2. **Increment `callIndex`** in `state.json` on every tool-call block (any batch of parallel tool invocations counts as one block).
3. **Rewrite `plan.md`** with current progress markers (`[x]` for all completed leaves).
4. **Rewrite `state.json`** with incremented `version` and current `lastAction`.
5. **No need** to update sub-plan files (those change only on step transitions).

This ensures that even if no step completed, the state is persisted every 5 calls so compaction doesn't lose context.

### 7. On Task Completion

1. Update `state.json`:
   ```json
   { "status": "completed", "completedAt": "2026-05-31T19:00:00Z" }
   ```
2. Delete `.hasit/` entirely:
   ```
   Remove-Item -LiteralPath ".hasit" -Recurse -Force
   ```

## File Formats

### `state.json`
| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | Unique session ID generated on task start (e.g. short UUID or `<timestamp>-<rand>`) |
| `version` | int | Monotonic counter incremented on every write. Detects corruption or partial writes. |
| `currentPath` | string | Dot-path of last completed leaf, e.g. `"3.2.4.5"` or `""` (hint only — trust `plan.md`) |
| `callIndex` | int | Cumulative tool-call count. Incremented each tool-call block. Used to enforce the every-5-calls checkpoint rule. |
| `status` | string | `"in_progress"` or `"completed"` |
| `task` | string | Short task description |
| `startedAt` | string | ISO 8601 timestamp |
| `completedAt` | string | ISO 8601 timestamp (only when completed) |
| `lastAction` | string | Brief description of the last action taken |

### `plan.md`
Full tree in markdown. Leaves are `[ ]` (pending) or `[x]` (done). Use 5-space indentation per level. Parent steps show no checkbox — only leaves have `[ ]` / `[x]`.

**This is the authoritative source of truth for progress.** If `plan.md` and `state.json` disagree, always trust `plan.md`.

### `plan--<path>.md`
Detail for any step node (branch or leaf): files to change, commands to run, expected outcomes, rollback instructions, design rationale. Named after the dotted path, e.g. `plan--3.2.4.5.md`. Branch files may hold context that applies to all children. Delete files for completed steps — only keep files for future/pending steps. If a file is missing on resume, reconstruct from `plan.md`.

## Rules
- **Always check `.hasit/` first** when starting a conversation turn after compaction. Never re-ask the user for the task.
- **Write before acting**: persist state before running any command that might trigger compaction.
- **Leaf markers only**: `[ ]` / `[x]` markers appear only on leaf nodes. A branch is implicitly done when all its children are `[x]`.
- **`plan.md` is source of truth**: `state.json` is a fast-read hint. When they disagree, scan `plan.md` depth-first.
- **Increment `version`** in `state.json` on every write. Helps detect partial writes and corruption.
- **Cleanup stale files**: delete each `plan--<path>.md` after the step is done. Branch files stay until all children are done.
- **Renumber on insert**: when adding steps between existing siblings, renumber all subsequent siblings and rename their `plan--<path>.md` files. Prefer appending to a new section if the cascade is large.
- **Reconstruct missing sub-plans**: if `plan--<nextPath>.md` is absent on resume, build it from the tree context in `plan.md`.
- **Depth-first traversal**: when finding the next step, scan `plan.md` depth-first, left-to-right. Pick the first `[ ]` leaf.
- **Dynamic sub-trees**: appending new children to an existing step is fine. Update `plan.md`, write new sub-plan files, renumber affected siblings.
- **Keep summaries brief** (1-2 sentences per action) to minimize file size.
- **Checkpoint every 5 tool calls**: increment `callIndex` in `state.json` after each tool-call block. When `callIndex % 5 == 0`, flush plan.md and state.json. Never let more than 5 consecutive tool-call blocks go without persisting state.
- **Cleanup is mandatory**: always delete `.hasit/` on completion. Leftover checkpoints confuse future sessions.

## Integration with opencode Compaction
This skill pairs with `compaction.auto: true` in `opencode.json`. When compaction prunes history, the LLM re-reads `.hasit/` to regain context. The tree structure lets it pinpoint exactly where to resume (e.g. `3.2.4.5`) without asking the user to restate the entire plan.
