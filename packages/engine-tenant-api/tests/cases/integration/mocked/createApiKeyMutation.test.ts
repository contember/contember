import { testUuid } from '../../../src/testUuid.js'
import { executeTenantTest } from '../../../src/testTenant.js'
import { SQL } from '../../../src/tags.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { createApiKeyMutation } from './gql/createApiKey.js'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'
import { createMembershipSql } from './sql/createMembershipSql.js'
import { createMembershipVariableSql } from './sql/createMembershipVariableSql.js'
import { createIdentitySql } from './sql/createIdentitySql.js'
import { createApiKeySql } from './sql/createApiKeySql.js'
import { getProjectMembershipSql } from './sql/getProjectMembershipSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { test } from 'vitest'

test('create api key', async () => {
	const languageId = testUuid(999)
	const identityId = testUuid(1)
	const apiKeyId = testUuid(2)
	const membershipId = testUuid(3)
	const variableId = testUuid(4)
	const projectId = testUuid(6)
	const projectSlug = 'blog'
	const role = 'editor'
	await executeTenantTest({
		query: createApiKeyMutation({
			projectSlug: projectSlug,
			memberships: [
				{
					role: role,
					variables: [{ name: 'language', values: [languageId] }],
				},
			],
			description: 'test key',
		}),
		executes: [
			getProjectBySlugSql({ projectSlug, response: { id: projectId, name: 'Blog', slug: projectSlug, config: {} } }),
			...sqlTransaction(
				createIdentitySql({ identityId, description: 'test key' }),
				createApiKeySql({ identityId, apiKeyId }),
				getProjectMembershipSql({ projectId, identityId }),
				createMembershipSql({ identityId, membershipId, projectId, role }),
				createMembershipVariableSql({ variableId, membershipId, values: [languageId], variableName: 'language' }),
			),
			{
				sql: SQL`SELECT "project"."id", "project"."name", "project"."slug", "project"."config"
					         FROM "tenant"."project"
					         WHERE "project"."id" IN (SELECT "project_id" FROM "tenant"."project_membership" WHERE "identity_id" = ?)`,
				parameters: [identityId],
				response: {
					rows: [{ id: projectId, name: 'test', slug: 'test' }],
				},
			},
			selectMembershipsSql({
				identityId: identityId,
				projectId: projectId,
				membershipsResponse: [{ role: role, variables: [{ name: 'language', values: [languageId] }] }],
			}),
		],
		return: {
			data: {
				createApiKey: {
					ok: true,
					errors: [],
					result: {
						apiKey: {
							identity: {
								projects: [{ project: { id: projectId }, memberships: [{ role: role }] }],
							},
						},
					},
				},
			},
		},
	})
})

