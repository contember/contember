import { Builder } from '@contember/dic'
import { MigrationDescriber, ModificationHandlerFactory, SchemaDiffer, SchemaMigrator, VERSION_LATEST } from '@contember/schema-migrations'
import { MigrationCreator } from '@contember/migrations-client'
import { SchemaVersionBuilder } from '@contember/migrations-client'
import { MigrationsResolver } from '@contember/migrations-client'
import { MigrationFilesManager } from '@contember/migrations-client'
import { JsonLoader } from '@contember/migrations-client'
import { MigrationParser } from '@contember/migrations-client'
import { JsLoader } from '@contember/migrations-client'
import { buildJs } from '../esbuild'

export interface MigrationsContainer {
	migrationCreator: MigrationCreator
	migrationDescriber: MigrationDescriber
	schemaVersionBuilder: SchemaVersionBuilder
	schemaDiffer: SchemaDiffer
	migrationsResolver: MigrationsResolver
	migrationFilesManager: MigrationFilesManager
	schemaMigrator: SchemaMigrator
}

const jsSample = `
export const query = \`\`
export const variables = {}

// or multiple queries
// export const queries = []

// or a factory
// export default async () => ({ queries: [] })
`

export class MigrationsContainerFactory {
	constructor(private readonly directory: string) {}

	public create(): MigrationsContainer {
		return new Builder({})
			.addService('migrationFilesManager', () => {
				const jsExecutor = async (file: string) => {
					const code = await buildJs(file)
					const fn = new Function(`var module = {}; ((module) => { ${code} })(module); return module`)
					return fn().exports
				}

				return new MigrationFilesManager(this.directory, {
					json: new JsonLoader(new MigrationParser()),
					ts: new JsLoader(new MigrationParser(), jsExecutor),
					js: new JsLoader(new MigrationParser(), jsExecutor),
				})
			})
			.addService('modificationHandlerFactory', () =>
				new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap))
			.addService('schemaMigrator', ({ modificationHandlerFactory }) =>
				new SchemaMigrator(modificationHandlerFactory))
			.addService('migrationsResolver', ({ migrationFilesManager }) =>
				new MigrationsResolver(migrationFilesManager))
			.addService('schemaVersionBuilder', ({ migrationsResolver, schemaMigrator }) =>
				new SchemaVersionBuilder(migrationsResolver, schemaMigrator))
			.addService('schemaDiffer', ({ schemaMigrator }) =>
				new SchemaDiffer(schemaMigrator))
			.addService('migrationCreator', ({ migrationFilesManager, schemaDiffer }) =>
				new MigrationCreator(migrationFilesManager, schemaDiffer, {
					json: JSON.stringify({ formatVersion: VERSION_LATEST, modifications: [] }, undefined, '\t') + '\n',
					ts: jsSample,
					js: jsSample,
				}))
			.addService('migrationDescriber', ({ modificationHandlerFactory }) =>
				new MigrationDescriber(modificationHandlerFactory))
			.build()
			.pick(
				'migrationCreator',
				'migrationDescriber',
				'schemaVersionBuilder',
				'schemaDiffer',
				'migrationsResolver',
				'migrationFilesManager',
				'schemaMigrator',
			)
	}
}
