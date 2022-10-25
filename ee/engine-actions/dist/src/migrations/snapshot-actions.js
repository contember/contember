"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function default_1(builder) {
    builder.sql(`
		CREATE TYPE EVENT_TRIGGER_STATE AS ENUM (
			'created' ,
			'retrying',
			'succeed',
			'failed',
			'stopped'
		);

		CREATE TABLE event_trigger
		(
			id              UUID PRIMARY KEY    NOT NULL,
			transaction_id  UUID                NOT NULL,
			created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
			resolved_at     TIMESTAMPTZ,
			next_attempt_at TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
			num_retries     INT                 NOT NULL,
			state           EVENT_TRIGGER_STATE NOT NULL DEFAULT 'created',
			stage_id        UUID                NOT NULL
				REFERENCES stage
					ON DELETE CASCADE,
			schema_id       INTEGER             NOT NULL
				REFERENCES schema_migration,
			trigger_name    TEXT                NOT NULL,
			invocation      JSONB               NOT NULL,
			payload         JSONB               NOT NULL,
			log             JSONB               NOT NULL DEFAULT '[]'
		);
	`);
}
exports.default = default_1;
//# sourceMappingURL=snapshot-actions.js.map