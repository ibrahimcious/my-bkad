# Deployment Runbook

Production deployment of the BKAD Pasuruan dashboard. The stack runs as
three Docker containers — PostgreSQL, the app, and an nginx reverse proxy
— defined in `docker-compose.prod.yml`.

## 1. Prerequisites

- A VPS hosted in Indonesia (data-sovereignty requirement). Any provider
  works — the stack is plain Docker. Candidates evaluated: Niagahoster
  Cloud VPS, IDCloudHost, Biznet Gio. Minimum ~2 vCPU / 2 GB RAM / 40 GB.
- Ubuntu 22.04 LTS or similar, with **Docker Engine** and the **Docker
  Compose plugin** installed.
- (For HTTPS) a domain name with an A record pointing at the VPS.

## 2. First deployment

```bash
# On the VPS:
git clone <repo-url> bkad-dashboard
cd bkad-dashboard

cp .env.production.example .env.production
# Edit .env.production — set every blank value. In particular:
#   (every `docker compose` command below passes --env-file .env.production
#    so Compose reads these values; without it the stack fails to start.)
#   POSTGRES_PASSWORD   strong random password
#   DATABASE_URL        must embed the same password
#   SESSION_PASSWORD    openssl rand -base64 32
#   SEED_*_PASSWORD     strong passwords for the three accounts

docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

The app container runs `prisma migrate deploy` on startup, so the database
schema is created automatically. Then seed the three user accounts:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec app pnpm db:seed
```

## 3. Verify

```bash
# Health endpoint — expect HTTP 200
curl -i http://<vps-ip>/healthz

docker compose --env-file .env.production -f docker-compose.prod.yml ps      # all services Up
docker compose --env-file .env.production -f docker-compose.prod.yml logs app
```

Open `http://<vps-ip>/` in a browser, sign in as the Kepala account, and
confirm the dashboard loads. Sign in as the uploader account and upload an
LRA file from `/admin/upload`.

## 4. Enable HTTPS

The shipped `nginx/nginx.conf` is HTTP-only so the stack runs immediately.
To add TLS once the domain resolves to the VPS:

1. Obtain a certificate with Certbot (webroot or standalone mode), e.g.:
   ```bash
   docker run --rm -p 80:80 \
     -v "$PWD/nginx/certs:/etc/letsencrypt" \
     certbot/certbot certonly --standalone -d dashboard.example.go.id
   ```
   (Stop the nginx container first if it holds port 80.)
2. Add an HTTPS server block to `nginx/nginx.conf` and redirect HTTP:
   ```nginx
   server {
       listen 80;
       server_name dashboard.example.go.id;
       return 301 https://$host$request_uri;
   }
   server {
       listen 443 ssl;
       server_name dashboard.example.go.id;
       client_max_body_size 20M;

       ssl_certificate     /etc/letsencrypt/live/dashboard.example.go.id/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/dashboard.example.go.id/privkey.pem;

       location / {
           proxy_pass http://app:3000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
3. Reload nginx: `docker compose --env-file .env.production -f docker-compose.prod.yml restart nginx`.
4. Renew certificates periodically (`certbot renew`) — schedule via cron.

## 5. Deploying an update

```bash
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Pending migrations apply automatically on container start. Watch the logs
and re-check `/healthz` afterwards.

## 6. Rollback

```bash
git checkout <previous-tag-or-commit>
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Note: a rollback does **not** revert database migrations. If a release
included a destructive migration, restore from a backup (below) instead.

## 7. Backups

The budget data can always be rebuilt by re-uploading the LRA file, but
back up the database regularly for the user accounts and upload history:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec postgres \
  pg_dump -U bkad bkad > backup-$(date +%F).sql
```

## 8. Error tracking & data residency

Error tracking uses Sentry's SaaS, enabled by setting `SENTRY_DSN` in
`.env.production`. Sentry ingests events on servers **outside Indonesia**,
and error payloads can contain request fragments. This is in tension with
the data-sovereignty rationale for hosting in Indonesia — confirm it is
acceptable with BKAD IT, and keep sensitive values out of error messages.
To disable error tracking entirely, leave `SENTRY_DSN` blank; the app then
relies on the structured Pino logs (`docker compose logs app`).
