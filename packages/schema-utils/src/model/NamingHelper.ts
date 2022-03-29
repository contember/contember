import crypto from 'crypto'

export class NamingHelper {
	public static createForeignKeyName(fromTable: string, fromColumn: string, toTable: string, toColumn: string): string {
		const uniqueSuffix = crypto
			.createHash('sha256')
			.update(JSON.stringify([fromTable, fromColumn, toTable, toColumn]), 'ascii')
			.digest('hex')

		return 'fk_' + fromTable + '_' + fromColumn + '_' + uniqueSuffix.slice(0, 6)
	}

	public static createUniqueConstraintName = (entityName: string, fields: readonly string[]): string => {
		const uniqueSuffix = crypto
			.createHash('sha256')
			.update(JSON.stringify([entityName, ...fields]), 'ascii')
			.digest('hex')

		return 'unique_' + entityName + '_' + fields.join('_') + '_' + uniqueSuffix.slice(0, 6)
	}
}
