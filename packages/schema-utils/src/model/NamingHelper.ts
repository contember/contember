import crypto from 'crypto'

export class NamingHelper {
	public static createForeignKeyName(fromTable: string, fromColumn: string, toTable: string, toColumn: string): string {
		return 'fk_'
			+ fromTable + '_'
			+ fromColumn + '_'
			+ this.createUniqueSuffix([fromTable, fromColumn, toTable, toColumn])
	}

	public static createIndexName = (entityName: string, fields: readonly string[]): string => {
		return 'idx_'
			+ entityName + '_'
			+ fields.join('_') + '_'
			+ this.createUniqueSuffix([entityName, ...fields])
	}

	public static createUniqueConstraintName = (entityName: string, fields: readonly string[]): string => {
		return 'unique_'
			+ entityName + '_'
			+ fields.join('_') + '_'
			+ this.createUniqueSuffix([entityName, ...fields])
	}

	private static createUniqueSuffix = (values: string[]): string => {
		const uniqueSuffix = crypto
			.createHash('sha256')
			.update(JSON.stringify(values), 'ascii')
			.digest('hex')
		return uniqueSuffix.slice(0, 6)
	}
}
