import { Authorizator } from '@contember/authorization'
import { Schema } from '@contember/schema'
import { ForbiddenError } from 'apollo-server-errors'
import { DatabaseContext, SchemaVersionBuilder } from '../model'
import { ProjectConfig } from '../types'
import { Identity } from '../model/authorization'
import { StagePermissionsFactory } from '../model/authorization/StagePermissionsFactory'
import { StageScope } from '../model/authorization/StageScope'
import { ItemLoader } from '../utils/batchQuery'
import { Client } from '@contember/database'

export class ResolverContextFactory {
	constructor(
		private readonly authorizator: Authorizator<Identity>,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async create(
		systemDbContext: DatabaseContext,
		tenantDb: Client,
		project: ProjectConfig,
		identity: Identity,
	): Promise<ResolverContext> {
		const schema = await this.schemaVersionBuilder.buildSchema(systemDbContext)
		const stagePermissionsFactory = new StagePermissionsFactory(schema)
		const loaders = new Map<LoaderFactory<any, any>, ItemLoader<any, any>>()
		return {
			project,
			identity,
			schema,
			authorizator: this.authorizator,
			db: systemDbContext,
			requireAccess: async (action, stage, message?) => {
				if (!(await this.authorizator.isAllowed(identity, new StageScope(stage, stagePermissionsFactory), action))) {
					throw new ForbiddenError(message || 'Forbidden')
				}
			},
			getLoader: loaderFactory => {
				const loader = loaders.get(loaderFactory)
				if (loader) {
					return loader
				}
				const newLoader = loaderFactory(systemDbContext)
				loaders.set(loaderFactory, newLoader)
				return newLoader
			},
			tenantDb,
		}
	}
}

export type LoaderFactory<Args, Item> = (db: DatabaseContext) => ItemLoader<Args, Item>

export interface ResolverContext {
	readonly project: ProjectConfig
	readonly schema: Schema
	readonly identity: Identity
	readonly db: DatabaseContext
	readonly authorizator: Authorizator<Identity>
	readonly requireAccess: (action: Authorizator.Action, stage: string, message?: string) => Promise<void>
	readonly getLoader: <Args, Item>(loaderFactory: LoaderFactory<Args, Item>) => ItemLoader<Args, Item>
	readonly tenantDb: Client
}
