import { Connection, wrapIdentifier } from '@contember/database'

export const dbCredentials = (dbName: string) => {
	return {
		host: String(process.env.TEST_DB_HOST),
		port: Number(process.env.TEST_DB_PORT),
		user: String(process.env.TEST_DB_USER),
		password: String(process.env.TEST_DB_PASSWORD),
		database: dbName,
	}
}

export const createConnection = (dbName: string): Connection => {
	return Connection.create(
		{
			...dbCredentials(dbName),
		},
		{
			max: 1,
		},
	)
}

export const recreateDatabase = async (dbName: string): Promise<Connection> => {
	const connection = createConnection(process.env.TEST_DB_MAINTENANCE_NAME || 'postgres')

	await connection.query('DROP DATABASE IF EXISTS ' + wrapIdentifier(dbName), [])
	await connection.query('CREATE DATABASE ' + wrapIdentifier(dbName), [])
	return connection
}
