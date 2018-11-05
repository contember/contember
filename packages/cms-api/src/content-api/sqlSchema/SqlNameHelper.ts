import * as crypto from 'crypto'

class SqlNameHelper {
	public static createForeignKeyName(fromTable: string, fromColumn: string, toTable: string, toColumn: string): string {
		const uniqueSuffix = crypto
			.createHash('sha256')
			.update(JSON.stringify([fromTable, fromColumn, toTable, toColumn]), 'ascii')
			.digest('hex')

		return 'fk_' + fromTable + '_' + fromColumn + '_' + uniqueSuffix.slice(0, 6)
	}
}

export default SqlNameHelper
