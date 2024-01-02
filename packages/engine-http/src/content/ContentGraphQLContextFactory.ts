import { Context, createAclVariables, ExecutionContainerFactory } from '@contember/engine-content-api'
import { Client, DatabaseMetadata } from '@contember/database'
import { Acl, Schema } from '@contember/schema'
import { AuthResult } from '../common'
import { Timer } from '../application'
import { Providers } from '../providers'
import { ParsedMembership } from '@contember/schema-utils'
import { Stage } from '@contember/engine-system-api'
import { ProjectConfig } from '../project/config'

export type ExtendedGraphqlContext = Context & {
	identityId: string
	requestDebug: boolean
}

export class ContentGraphQLContextFactory {
	constructor(
		private providers: Providers,
		private executionContainerFactory: ExecutionContainerFactory,
	) {
	}

	create({ db, schema, schemaDatabaseMetadata, authResult, memberships, permissions, timer, requestDebug, systemSchema, stage, project }: {
		db: Client
		schema: Schema & { id: number }
		schemaDatabaseMetadata: DatabaseMetadata
		permissions: Acl.Permissions
		authResult: AuthResult
		memberships: readonly ParsedMembership[]
		timer: Timer
		requestDebug: boolean
		systemSchema: string
		stage: Stage
		project: ProjectConfig
	}): ExtendedGraphqlContext {
		const identityVariables = createAclVariables(schema.acl, memberships)
		let identityId = authResult.identityId
		if (
			authResult.assumedIdentityId &&
			memberships.some(it => schema.acl.roles[it.role].system?.assumeIdentity)
		) {
			identityId = authResult.assumedIdentityId
		}

		const executionContainer = this.executionContainerFactory.create({
			db,
			identityVariables,
			identityId,
			schema,
			schemaDatabaseMetadata,
			permissions,
			systemSchema,
			stage,
			project,
		})

		return {
			db,
			identityVariables,
			identityId,
			executionContainer,
			timer,
			requestDebug,
		}
	}
}
