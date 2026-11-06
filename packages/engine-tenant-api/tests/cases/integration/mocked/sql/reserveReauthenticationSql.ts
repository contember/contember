import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

/**
 * The attempt reservation `ReauthenticationVerifier.verify` runs before it checks a credential (the mocked hash provider
 * stores the key verbatim). `attempts` is the count within the window including this one; above 5 the attempt is refused.
 */
export const reserveReauthenticationSql = (args: { personId: string; attempts?: number }): ExpectedQuery[] => [
	{
		sql: SQL`insert into "tenant"."rate_limit_event" ("id", "scope", "key_hash") values (?, ?, ?)`,
		parameters: [(id: unknown) => typeof id === 'string', 'reauthentication_per_person', Buffer.from(args.personId)],
		response: { rowCount: 1 },
	},
	{
		sql: SQL`select count(*)::text as count from "tenant"."rate_limit_event"
			where "scope" = ? and "key_hash" = ? and occurred_at >= NOW() - make_interval(secs => ?)`,
		parameters: ['reauthentication_per_person', Buffer.from(args.personId), 900],
		response: { rows: [{ count: String(args.attempts ?? 1) }] },
	},
]
