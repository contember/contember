# Local object storage (SeaweedFS)

`identities.json` is the `-s3.config` file for the `object-storage` compose service. JSON carries no
comments, so the two identities are explained here.

- **`anonymous`** — the unauthenticated caller. `Read:contember` makes exactly one bucket publicly
  readable, which is what the engine's asset bucket needs: `generateUploadUrl` hands the browser a
  `publicUrl` with no credentials on it. Any other bucket added to `S3_BUCKET` stays private until
  it is listed here as well.
- **`contember`** — the credentials the engine signs upload and read URLs with
  (`DEFAULT_S3_KEY` / `DEFAULT_S3_SECRET`). Local dev only.

Buckets are not declared here; the service creates them from `S3_BUCKET` on start.
