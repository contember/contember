CREATE TABLE "system"."schema_migration" (
    "id"          SERIAL4      NOT NULL,
    "version"     VARCHAR(20) NOT NULL UNIQUE,
    "name"        VARCHAR(255) NOT NULL UNIQUE,
    "migration"   JSON         NOT NULL,
    "checksum"    CHAR(32)     NOT NULL,
    "executed_at" TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX "system_schema_migration_version" ON "system"."schema_migration"("version")
