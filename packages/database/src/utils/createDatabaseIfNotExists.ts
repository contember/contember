import { DatabaseConfig } from '../types.js'
import { ClientError, ClientErrorCodes, Connection } from '../client/index.js'
import { wrapIdentifier } from './sql.js'

export const createDatabaseIfNotExists = async (db: DatabaseConfig, log: (message: string | Error) => void) => {
	try {
		const connection = Connection.createSingle(db, log)
		await connection.query('SELECT 1')
		await connection.end()
		return
	} catch (e) {
		if (!(e instanceof ClientError && e.code === ClientErrorCodes.INVALID_CATALOG_NAME)) {
			throw e
		}
	}

	log(`Database ${db.database} does not exist, attempting to create it...`)
	const connection = Connection.createSingle({ ...db, database: 'postgres' }, log)
	await connection.query(`CREATE DATABASE ${wrapIdentifier(db.database)}`)
	await connection.end()
}
