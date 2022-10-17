import { Context, createAclVariables, ExecutionContainerFactory } from '@contember/engine-content-api'
import { Client } from '@contember/database'
import { Acl, Schema } from '@contember/schema'

import { AuthResult, Timer } from '../common'
import { KoaContext } from '../koa'
import { Providers } from '../providers'
import { GraphQLKoaState } from '../graphql'
import { ParsedMembership } from '@contember/schema-utils'
import { Stage } from '@contember/engine-system-api'

export type ExtendedGraphqlContext = Context & {
	identityId: string
	koaContext: KoaContext<GraphQLKoaState>
	requestDebug: boolean
}

export class ContentGraphQLContextFactory {
	constructor(
		private providers: Providers,
		private executionContainerFactory: ExecutionContainerFactory,
	) {
	}

	create({ db, schema, authResult, memberships, permissions, timer, koaContext, requestDebug, systemSchema, stage }: {
		db: Client
		schema: Schema & { id: number }
		permissions: Acl.Permissions
		authResult: AuthResult
		memberships: readonly ParsedMembership[]
		timer: Timer
		koaContext: KoaContext<GraphQLKoaState>
		requestDebug: boolean
		systemSchema: string
		stage: Stage
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
			permissions,
			systemSchema,
			stage,
		})

		return {
			db,
			identityVariables,
			identityId,
			executionContainer,
			timer,
			koaContext,
			requestDebug,
		}
	}
}
