# engine-server

Entry point for the Contember backend. Bootstraps the DI container, loads plugins, resolves configuration, and manages process lifecycle (single-node or clustered).

## Boot Sequence

1. `start.ts`: Load plugins (S3, Vimeo, Actions), resolve config from env/YAML/JSON, create `MasterContainer` from `engine-http`
2. Master process: run tenant migrations, initialize projects, start monitoring server (Prometheus)
3. If `workerCount` configured: fork worker processes via `WorkerManager` with auto-restart on crash
4. Workers: start HTTP server via `container.application.listen()`

## Clustering

- `WorkerManager` forks Node.js child processes, coordinates via IPC (`msg_worker_started`)
- 15-second startup timeout per worker, 2-second delay on restart
- Graceful termination: disconnect → kill sequence

## Plugins

`loadPlugins()` returns `[S3Plugin(), VimeoPlugin(), ActionsPlugin()]`. Plugins hook into config, schema, execution container, and master container lifecycle.

## Config

Loaded from `CONTEMBER_CONFIG_FILE` (YAML), `CONTEMBER_CONFIG_YAML`, or `CONTEMBER_CONFIG_JSON` env vars. Key env vars: `NODE_ENV` (debug mode), `CONTEMBER_LOGGER_FORMAT` (pretty/json).
