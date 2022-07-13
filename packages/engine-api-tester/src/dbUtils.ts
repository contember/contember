import { Connection, DatabaseConfig, wrapIdentifier } from '@contember/database'

export const dbCredentials = (dbName: string) => {
	return {
		host: String(process.env.TEST_DB_HOST),
		port: Number(process.env.TEST_DB_PORT),
		user: String(process.env.TEST_DB_USER),
		password: String(process.env.TEST_DB_PASSWORD),
		database: dbName,
	}
}

export const createConnection = (config: DatabaseConfig): Connection => {
	return Connection.create(config)
}

export const recreateDatabase = async ({ database, ...baseConfig }: DatabaseConfig): Promise<Connection> => {
	const connection = createConnection({ ...baseConfig, database: process.env.TEST_DB_MAINTENANCE_NAME || 'postgres' })

	await connection.query('DROP DATABASE IF EXISTS ' + wrapIdentifier(database), [])
	await connection.query('CREATE DATABASE ' + wrapIdentifier(database), [])
	return connection
}
