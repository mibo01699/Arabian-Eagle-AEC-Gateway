# Arabian Eagle AEC Gateway

## Project Overview

**Arabian Eagle AEC Gateway** is the unified entry point for the Arabian Eagle A.E.C ecosystem. It acts as a reverse proxy and service registry, aggregating health status from all microservices and providing a consistent API and frontend interface.

This repository contains the Gateway component. All services are currently in **development/prototype** phase and **not deployed** to production. The Gateway is configured to run in `testnet` mode by default.

---

## Architecture

```

Pi Browser / Client
│
▼
┌─────────────────────┐
│  AEC Gateway        │
│  - Service Registry │
│  - Health Checks    │
│  - Rate Limiting    │
│  - Security Headers │
│  - Frontend UI      │
└─────────┬───────────┘
│
▼
┌─────────────────────┐
│  BIGISH-YER         │  ← First operational service (testnet-ready)
│  - YER Tokenomics   │
│  - Ledger (in-mem)  │
│  - Idempotency      │
└─────────────────────┘

```

Other services (GAV, AJYAL, Suppliers Auction, COBRA, AMAN, Be-Well, TELCOM, AEC Fund) are **NOT_DEPLOYED** in this phase. They will be onboarded once their foundations are complete.

---

## Gateway Role

- **Service Registry**: Maintains a list of all ecosystem applications with their URLs and current status (`ONLINE`, `DEGRADED`, `OFFLINE`, `NOT_DEPLOYED`, `UNKNOWN`).
- **Health Probes**: Periodically pings each service's `/api/health` endpoint to determine real-time availability.
- **Request Routing**: (Future) Will proxy requests to the appropriate backend service.
- **Security**: Enforces HTTP security headers (Helmet), CORS policies, rate limiting, and input validation.
- **Frontend**: Provides a dashboard displaying service status, environment information, and Pi integration status.
- **Centralized Logging**: Logs all requests and errors.

---

## Current Status

- **Gateway**: Functional, ready for local development and testnet deployment.
- **BIGISH-YER**: The only service configured; its health endpoint is checked by the Gateway.
- **All Other Services**: `NOT_DEPLOYED`. Placeholder entries exist in the registry.

---

## Testnet Scope

- **All operations are testnet-only**. No mainnet transactions or real financial activity occur.
- The Gateway environment variable `NODE_ENV` should be set to `testnet` for all non‑local deployments.

---

## Environment Variables

See `.env.example` for a full list. Required variables:

| Variable           | Description                        | Example                    |
|--------------------|------------------------------------|----------------------------|
| `PORT`             | Port the server listens on         | `3000`                     |
| `NODE_ENV`         | Environment (`development`/`testnet`) | `testnet`                |
| `CORS_ORIGIN`      | Allowed origin for CORS            | `https://your-pi-app.com`  |
| `BIGISH_YER_URL`   | URL to BIGISH-YER service (with `/api`) | `http://localhost:3001/api` |
| `HEALTH_TIMEOUT`   | Health check timeout in ms         | `5000`                     |
| `PI_API_KEY`       | Pi Platform API key (server-side only) | `NOT_CONFIGURED`          |

**Never commit real secrets.** Use environment variables in production.

---

## Local Development

### Prerequisites

- Node.js v18+ and npm
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/mibo01699/Arabian-Eagle-AEC-Gateway.git
cd Arabian-Eagle-AEC-Gateway

# Install dependencies
npm ci

# Create environment file
cp .env.example .env
# Edit .env with your local service URLs

# Start the Gateway
npm start
# Or with auto-reload:
npm run dev
```

The Gateway will be available at http://localhost:3000.

Running with BIGISH-YER

1. Start BIGISH-YER (see its own README) on http://localhost:3001.
2. Ensure .env has BIGISH_YER_URL=http://localhost:3001/api.
3. Gateway will automatically detect the service and display its status.

---

Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Check security headers and middleware
npm run test:security
```

All tests must pass before any deployment. No test is skipped or bypassed.

---

Deployment

Currently, the Gateway is not deployed to any public hosting. Recommended platforms for testnet deployment:

· Vercel (with serverless functions)
· Heroku (easy environment config)
· DigitalOcean / AWS (full control)

Checklist before deployment:

☐ Set NODE_ENV=testnet
☐ Configure all environment variables
☐ Verify HTTPS is enabled
☐ Ensure health endpoint responds
☐ Test Pi Browser compatibility

---

Pi Integration Status

Component Status
Pi SDK included ✅ Yes
Pi.authenticate() frontend ✅ Example page
Server-side token verification ❌ Not implemented
Pi Payments (create/approve/complete) ❌ Not implemented
App Wallet configured ❌ Not configured
Pi Testnet transactions ❌ Not processed

Current integration is foundation-only: the frontend has a demo page for Pi authentication, but no backend verification or payment flows are active. This will be completed in a later phase.

---

Security

· Helmet: Sets secure HTTP headers (CSP, XSS protection, etc.)
· CORS: Only allows requests from configured origin
· Rate Limiting: Limits API requests per IP (100 per 15 min)
· Input Validation: Validates request params and body
· Error Handling: No stack traces exposed in production
· Secrets: Never committed; all keys come from environment

---

Known Limitations

· Service Registry: Hardcoded URLs in .env. Dynamic registration not implemented.
· Health Checks: Only BIGISH-YER has a realistic health endpoint; others return NOT_DEPLOYED.
· No Persistent Storage: Gateway does not store any data (stateless).
· Pi Integration: Demo only; no real authentication or payments.
· Logging: Basic console logging; no external log aggregation.

---

Roadmap

1. ✅ Phase 1: Gateway foundation + BIGISH-YER testnet-ready.
2. Phase 2: Persistent storage for Gateway (service registry DB).
3. Phase 3: Full Pi authentication (server-side verification).
4. Phase 4: Integrate GAV and AJYAL services.
5. Phase 5: Enable Pi payments (testnet).
6. Phase 6: Production hardening and audit.

---

License

Proprietary – Arabian Eagle A.E.C.

---

Contact

For internal use only. No public contact information provided.
