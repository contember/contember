import Sha256 from 'crypto-js/sha256'
import EncHex from 'crypto-js/enc-hex'


export class NamingHelper {
	public static createForeignKeyIndexName(tableName: string, column: string) {
		// format matches https://github.com/salsita/node-pg-migrate/blob/9331f6fda98795e3f3733461f9b71345168b99d8/src/operations/indexes.ts#L21
		return `${tableName}_${column}_index`
	}

	public static createJunctionTablePrimaryConstraintName(tableName: string) {
		// format matches https://github.com/salsita/node-pg-migrate/blob/9331f6fda98795e3f3733461f9b71345168b99d8/src/operations/tables.ts#L204
		return `${tableName}_pkey`
	}

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
		const uniqueSuffix = Sha256(JSON.stringify(values)).toString(EncHex)
		return uniqueSuffix.slice(0, 6)
	}
}
