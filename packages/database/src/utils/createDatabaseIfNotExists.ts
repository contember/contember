import { DatabaseConfig } from '../types'
import { ClientError, ClientErrorCodes, SingleConnection } from '../client'
import { wrapIdentifier } from './sql'

export const createDatabaseIfNotExists = async (db: DatabaseConfig, log: (message: string) => void) => {
	try {
		const connection = new SingleConnection(db, {})
		await connection.query('SELECT 1')
		await connection.end()
		return
	} catch (e) {
		if (!(e instanceof ClientError && e.code === ClientErrorCodes.INVALID_CATALOG_NAME)) {
			throw e
		}
	}

	log(`Database ${db.database} does not exist, attempting to create it...`)
	const connection = new SingleConnection({ ...db, database: 'postgres' }, {})
	await connection.query(`CREATE DATABASE ${wrapIdentifier(db.database)}`)
	await connection.end()
}
