import { SingleConnection } from '@contember/database'
import { parse as parsePgConnString } from 'pg-connection-string'
import { ModelGenerator } from './generator/ModelGenerator'
import { ReflectionTool } from './reflection/ReflectionTool';
(async () => {

	const config = parsePgConnString(process.argv[2])
	const connection = new SingleConnection({
		host: config.host ?? 'localhost',
		user: config.user ?? 'postgres',
		password: config.password ?? 'postgres',
		port: Number.parseInt(config.port ?? '5432'),
		database: config.database ?? 'postgres',
		ssl: config.ssl !== undefined ? !!config.ssl : undefined,
	}, {})
	const reflection = new ReflectionTool(connection)
	const database = await reflection.getDatabaseSchema('schema' in config ? (config as any).schema : 'public')

	const generator = new ModelGenerator()
	console.log(generator.generate(database))
	await connection.end()
})().catch(e => {
	console.error(e)
	process.exit(1)
})
