# react-uploader

File upload management with S3 integration, progress tracking, and entity binding.

## Core Components

- `Uploader` / `MultiUploader` — main upload components
- `UploaderBase` — base wrapper for HasOne relations
- `DiscriminatedUploader` — support for discriminated entity types
- `UploaderEachFile`, `UploaderFileStateSwitch`, `UploaderHasFile` — state-based rendering

## File State Machine

`initial` → `uploading` (with progress) → `finalizing` → `success` | `error`

## S3 Integration

`S3UploadClient` implements `UploadClient`:
- Concurrency control (default 5 simultaneous uploads)
- XHR-based upload with progress tracking
- Signed URL generation via GraphQL mutation (`generateUploadUrl`)

## Binding Integration

Integrates with `@contember/react-repeater` and `@contember/react-binding` to automatically create/fill entity fields with uploaded file metadata (URL, size, type, etc.).
