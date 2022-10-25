"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function default_1(builder) {
    builder.sql(`
		CREATE TYPE ACTIONS_TRIGGER_STATE AS ENUM (
			'created' ,
			'retrying',
			'processing',
			'succeed',
			'failed',
			'stopped'
		);

		CREATE TABLE actions_event
		(
			id              UUID PRIMARY KEY    NOT NULL,
			transaction_id  UUID                NOT NULL,
			created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
			resolved_at     TIMESTAMPTZ,
			visible_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
			num_retries     INT                 NOT NULL,
			state           ACTIONS_TRIGGER_STATE NOT NULL DEFAULT 'created',
			last_state_change TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			stage_id        UUID                NOT NULL
				REFERENCES stage
					ON DELETE CASCADE,
			schema_id       INTEGER             NOT NULL
				REFERENCES schema_migration,
			target          TEXT                NOT NULL,
			payload         JSONB               NOT NULL,
			log             JSONB               NOT NULL DEFAULT '[]'
		);

		CREATE INDEX ON actions_event (visible_at) WHERE state IN ('created', 'retrying', 'processing');

		CREATE TABLE actions_worker
		(
			id UUID PRIMARY KEY NOT NULL,
			started_at UUID NOT NULL,
			last_
		)
	`);
}
exports.default = default_1;
//# sourceMappingURL=snapshot.js.map