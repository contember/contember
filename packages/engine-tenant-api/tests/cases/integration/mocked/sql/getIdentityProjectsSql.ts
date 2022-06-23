import { SQL } from '../../../../src/tags.js'

export const getIdentityProjectsSql = function ({ identityId, projectId }: { identityId: string; projectId: string }) {
	return {
		sql: SQL`SELECT "project"."id", "project"."name", "project"."slug", "project"."config"
				 FROM "tenant"."project"
				 WHERE "project"."id" IN
					   (SELECT "project_id" FROM "tenant"."project_membership" WHERE "identity_id" = ?)
				   AND "project"."id" IN
					   (SELECT "project_id" FROM "tenant"."project_membership" WHERE "identity_id" = ?)`,
		parameters: [identityId, identityId],
		response: { rows: [{ id: projectId, name: 'Foo', slug: 'foo' }] },
	}
}
