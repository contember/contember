import { MigrationBuilder } from '@contember/database-migrations'

const sql = `

DROP FUNCTION IF EXISTS rebase_events_unsafe(head UUID, oldBase UUID, newBase UUID, appliedEvents UUID[]);

CREATE OR REPLACE FUNCTION rebase_events_unsafe(head UUID, oldBase UUID, newBase UUID, appliedEvents UUID[]) RETURNS TABLE (
	new_id UUID,
	old_id UUID
) AS
$$

WITH RECURSIVE events(id, type, data, previous_id, created_at, identity_id, transaction_id, index) AS (
	SELECT event.id, event.type, event.data, event.previous_id, event.created_at, event.identity_id, event.transaction_id, 0
	FROM event
	WHERE event.id = head AND event.id <> oldBase
	UNION
	SELECT event.id, event.type, event.data, event.previous_id, event.created_at, event.identity_id, event.transaction_id, index + 1
	FROM event, events
	WHERE event.id = events.previous_id AND events.previous_id <> oldBase
),
	filtered_with_ids AS (
		SELECT event.id, event.type, event.data, event.previous_id, event.created_at, event.identity_id, event.transaction_id, 0, event.id AS new_id,
			NULL AS new_trx_id, 0 AS number
		FROM event
		WHERE id = newBase
		UNION
		SELECT *,
			uuid_generate_v4() AS new_id,
			uuid_generate_v4() AS new_trx_id,
			row_number() OVER (ORDER BY events.index DESC) AS number
		FROM events
		WHERE NOT (id = ANY (appliedEvents))
	),
	with_ids_by_window AS (
		SELECT *,
			first_value(filtered_with_ids.new_id) OVER (ORDER BY number ROWS 1 PRECEDING) AS new_previous_id,
			first_value(filtered_with_ids.new_trx_id) OVER (PARTITION BY filtered_with_ids.transaction_id) AS new_trx_id2
		FROM filtered_with_ids
	),
	insert AS (
		INSERT
			INTO event(id, type, data, previous_id, created_at, identity_id, transaction_id)
				SELECT new_id, type, data, new_previous_id, created_at, identity_id, new_trx_id2
				FROM with_ids_by_window
				WHERE with_ids_by_window.number > 0 RETURNING *
	)
SELECT insert.id as new_id, with_ids_by_window.id as old_id
FROM with_ids_by_window
		 JOIN insert ON insert.id = with_ids_by_window.new_id
ORDER BY number DESC
$$
	LANGUAGE SQL;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
