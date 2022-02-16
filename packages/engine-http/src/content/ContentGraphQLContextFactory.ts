import { getArgumentValues } from 'graphql/execution/values'

import { Context, createAclVariables, ExecutionContainerFactory } from '@contember/engine-content-api'
import { setupSystemVariables } from '@contember/engine-system-api'
import { Client } from '@contember/database'
import { Acl, Schema } from '@contember/schema'
import { Membership } from '@contember/engine-tenant-api'

import { AuthResult, Timer } from '../common'
import { KoaContext } from '../koa'
import { Providers } from '../providers'
import { GraphQLKoaState } from '../graphql'

export type ExtendedGraphqlContext = Context & { identityId: string; koaContext: KoaContext<GraphQLKoaState> }

export class ContentGraphQLContextFactory {
	constructor(
		private providers: Providers,
	) {
	}

	create({ db, schema, authResult, memberships, permissions, timer, koaContext }: {
		db: Client
		schema: Schema
		permissions: Acl.Permissions
		authResult: AuthResult
		memberships: readonly Membership[]
		timer: Timer
		koaContext: KoaContext<GraphQLKoaState>
	}): ExtendedGraphqlContext {
		const partialContext = {
			db,
			identityId: authResult.identityId,
			identityVariables: createAclVariables(schema.acl, {
				...authResult,
				memberships,
			}),
		}
		let identityId = authResult.identityId
		if (
			authResult.assumedIdentityId &&
			Object.values(schema.acl.roles).find(it => it.system?.assumeIdentity)
		) {
			identityId = authResult.assumedIdentityId
		}

		const executionContainer = new ExecutionContainerFactory(schema, permissions, this.providers, getArgumentValues, db =>
			setupSystemVariables(db, identityId, this.providers),
		).create(partialContext)

		return {
			...partialContext,
			executionContainer,
			timer,
			koaContext,
		}
	}
}
