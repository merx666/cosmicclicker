---
name: void-deployment-validation
description: Rules and checks to perform before deploying to the production server at void.skyreel.art.
risk: safe
source: "project-local"
date_added: "2026-06-27"
---

# Void Deployment Validation Guard

Ensure that all code changes undergo strict pre-flight checks before being pushed or deployed via SSH to the production server. This is critical because testing locally is not fully possible for MiniKit, and production builds must succeed on the server first time.

## When to Use

Use this skill whenever:
- The user requests a deployment, rollout, release, or push to production.
- You are about to run deployment scripts (e.g., `deploy.sh`, `deploy_local.sh`, `deploy_telegram.sh`).
- You have made changes to the Next.js codebase, routing, environment files, or Nginx configs.

## Guardrails & Validation Steps

### 1. No Local Building/Rendering
- **Hard Constraint:** Do not attempt to run `npm run build` or start a local dev server to test World ID / MiniKit integrations. They require authenticated domain handshake and will fail or provide false results.
- **Exceptions:** You may run quick syntax checks (e.g., `node -c`) or static checking tools.

### 2. Mandatory Pre-Flight Compilation Checks
Before triggering the deployment script or initiating the SSH connection:
1. **TypeScript Typecheck:** Run a static non-emitting typecheck:
   ```bash
   npx tsc --noEmit
   ```
   Do not proceed if there are any TypeScript compiler errors.
2. **Linting Check:** Run the linter to catch syntax or formatting issues:
   ```bash
   npx eslint
   ```
   Resolve all errors and major warnings.

### 3. Target Environment Validation
- Ensure Nginx configuration blocks or API endpoints resolve to the production domain: `void.skyreel.art` (or `claw.skyreel.art` for OpenClaw).
- Verify that critical environment variables (e.g., `WORLD_APP_ID`, `WORLD_RP_ID`, `RP_SIGNING_KEY`, `DATABASE_URL`) are configured properly on the target server rather than bundled in frontend static files.

### 4. Deploying via SSH
1. Connect via `ssh prod` to reach the production server.
2. Sync the codebase (using git or file sync script like `deploy_local.sh`).
3. Compile and build the project **directly on the server**.
4. Check the application status in PM2:
   ```bash
   pm2 status
   # Verify void-collector, void-telegram, or openclaw is online
   ```
5. Ensure Nginx and Certbot SSL certificates are active and valid.
