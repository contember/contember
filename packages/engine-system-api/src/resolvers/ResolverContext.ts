import { AuthorizationScope, Authorizator } from '@contember/authorization'
import { Acl, Schema } from '@contember/schema'
import { ForbiddenError } from 'apollo-server-errors'
import { DatabaseContext, SchemaVersionBuilder } from '../model'
import { ProjectConfig } from '../types'
import { Identity } from '../model/authorization'
import { StagePermissionsFactory } from '../model/authorization/StagePermissionsFactory'
import { StageScope } from '../model/authorization/StageScope'

export class ResolverContextFactory {
	constructor(
		private readonly authorizator: Authorizator<Identity>,
		private readonly schemaVersionBuilder: SchemaVersionBuilder,
	) {}

	public async create(
		systemDbContext: DatabaseContext,
		project: ProjectConfig,
		identity: Identity,
		variables: Acl.VariablesMap,
	): Promise<ResolverContext> {
		const schema = await this.schemaVersionBuilder.buildSchema(systemDbContext)
		const stagePermissionsFactory = new StagePermissionsFactory(schema)
		return {
			project,
			identity,
			variables,
			schema,
			authorizator: this.authorizator,
			db: systemDbContext,
			requireAccess: async (action, stage, message?) => {
				if (!(await this.authorizator.isAllowed(identity, new StageScope(stage, stagePermissionsFactory), action))) {
					throw new ForbiddenError(message || 'Forbidden')
				}
			},
		}
	}
}

export interface ResolverContext {
	readonly project: ProjectConfig
	readonly schema: Schema
	readonly identity: Identity
	readonly db: DatabaseContext
	readonly variables: Acl.VariablesMap
	readonly authorizator: Authorizator<Identity>
	readonly requireAccess: (action: Authorizator.Action, stage: string, message?: string) => Promise<void>
}
