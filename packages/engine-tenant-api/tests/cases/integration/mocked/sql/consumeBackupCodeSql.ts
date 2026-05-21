import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'
import { now } from '../../../../src/testTenant'

/**
 * Mocks BackupCodeManager.verifyAndConsume: an atomic UPDATE that only touches an
 * unused row. `consumed: false` (rowCount 0) models a code that was already used
 * (or never existed), which the manager treats as a failed verification.
 */
export const consumeBackupCodeSql = (args: {
	personId: string
	codeHash: string
	consumed: boolean
}): ExpectedQuery => ({
	sql: SQL`update "tenant"."person_backup_code" set "used_at" = ? where "person_id" = ? and "code_hash" = ? and "used_at" is null`,
	parameters: [now, args.personId, args.codeHash],
	response: { rowCount: args.consumed ? 1 : 0 },
})
