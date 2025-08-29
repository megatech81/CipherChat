# CipherChat

> "Messages that remain yours alone"

Secure, end‑to‑end encrypted messaging with ephemeral messages, groups, and communities.

## Stack Overview

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + TypeScript (PWA) |
| Backend (primary) | Go (net/http + Gorilla WebSocket) |
| Backend (alt prototype) | Rust (Axum + tokio) |
| State (client) | Zustand + react-query |
| Data (future prod) | PostgreSQL, Redis, MinIO (dev via docker-compose) |
| Messaging Transport | WebSocket (binary/text frames) |
| CI/CD | Jenkins pipeline + Docker + Kubernetes manifests |
| Package Mgmt | npm workspaces |
| License | Apache-2.0 |

The cryptographic layer is still a placeholder; do not use for real secrets.

## Monorepo Structure

```
/apps
  /web
  /server-go
  /server-rust        # optional experimental
/packages
  /crypto
  /proto
  /ui
  /utils
/config
/deploy
  /k8s
/docs
```

## Quick Start (Dev)

Prereqs: Node 18+, Go 1.22+, (Rust stable if using Rust server), Docker

Install JS deps:
```
npm install
```

Run web (dev):
```
npm run dev --workspace=@cipherchat/web
```

Run Go server:
```
cd apps/server-go
go run ./cmd/cipherchat
```

Open http://localhost:5173 (default Vite port).

## Docker (Dev Compose)

```
docker compose up --build
```

Services:
- web: Vite dev server (hot reload)
- api: Go server on 8080
- postgres, redis, minio: future persistence targets (not yet consumed)
- nginx (optional) can be added later as ingress sim.

## Kubernetes (Baseline Manifests)

Manifests in /deploy/k8s (namespace, deployments, services, configmap, secret placeholder, ingress). Adjust image repo + domains before applying:

```
kubectl apply -f deploy/k8s/namespace.yaml
kubectl apply -f deploy/k8s/
```

## CI/CD (Jenkins)

See Jenkinsfile:
- Stage: Checkout
- Stage: Install (npm ci)
- Stage: Build web
- Stage: Go build + tests
- Stage: Docker build & push (web + api)
- Stage: K8s Deploy (kubectl apply) (guarded by environment/prod approval)

Secrets required:
- DOCKER_REGISTRY, DOCKER_USERNAME, DOCKER_PASSWORD (credentials)
- KUBE_CONFIG or in-cluster ServiceAccount
- APP_VERSION (auto-set from git describe or Jenkins build number)

## Choosing Backend

Default pipeline and compose use Go. Rust scaffold provided for exploration. To switch:
- Update docker-compose.yml service api context to apps/server-rust
- Adjust Jenkinsfile BACKEND_IMPL var.

## Security Roadmap

1. Replace placeholder crypto with audited Signal Protocol impl (libsignal-client via WASM or native).
2. Add formal key verification (QR + safety number).
3. Device list & multi-device key sync.
4. Group key management (initial symmetric rotation → MLS roadmap).

## Disclaimers

Not production ready; encryption placeholder; metadata minimization not fully enforced.

## License

Apache-2.0 (see LICENSE file).