import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'
import { testUuid } from '../../../../src/testUuid.js'
import { now } from '../../../../src/testTenant.js'
import { sqlTransaction } from './sqlTransaction.js'

/**
 * Mocks the SQL emitted by BackupCodeManager.generate: delete the old set, then
 * insert 10 fresh codes. With the test providers (randomBytes => all zeros) every
 * generated code is "aaaaa-aaaaa", whose normalized sha256 hash is constant.
 */
const CODE_HASH = 'bf2cb58a68f684d95a3b78ef8f661c9a4e5b09e82cc8f9cc88cce90528caeb27'

export const generateBackupCodesSql = (args: {
	personId: string
	/** First uuid the manager will consume for the inserts (sequential from here). */
	firstUuidIndex: number
}): ExpectedQuery[] => {
	// generate() replaces the whole set inside a single REPEATABLE READ transaction.
	const inner: ExpectedQuery[] = [
		{
			sql: SQL`DELETE FROM "tenant"."person_backup_code" WHERE "person_id" = ?`,
			parameters: [args.personId],
			response: { rowCount: 0 },
		},
	]
	for (let i = 0; i < 10; i++) {
		inner.push({
			sql: SQL`INSERT INTO "tenant"."person_backup_code" ("id", "person_id", "code_hash", "created_at") VALUES (?, ?, ?, ?)`,
			parameters: [testUuid(args.firstUuidIndex + i), args.personId, CODE_HASH, now],
			response: { rowCount: 1 },
		})
	}
	return sqlTransaction(...inner)
}
