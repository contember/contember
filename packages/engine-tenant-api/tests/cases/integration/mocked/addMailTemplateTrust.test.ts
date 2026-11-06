import { expect, test } from 'bun:test'
import { executeTenantTest } from '../../../src/testTenant.js'
import { GQL, SQL } from '../../../src/tags.js'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'

const PROJECT_ID = '123e4567-e89b-12d3-a456-000000000001'
const anyString = (value: unknown) => typeof value === 'string'

const addTemplate = (identityRoles: string[], trusted: boolean) =>
	executeTenantTest({
		query: GQL`mutation {
			addMailTemplate(template: { projectSlug: "blog", type: RESET_PASSWORD_REQUEST, subject: "Reset", content: "{{token}}" }) {
				ok
			}
		}`,
		identityRoles,
		authorizator: { isAllowed: () => Promise.resolve(true) },
		executes: [
			getProjectBySlugSql({
				projectSlug: 'blog',
				response: { id: PROJECT_ID, name: 'Blog', slug: 'blog', config: {} },
			}),
			{
				sql:
					SQL`insert into "tenant"."mail_template" ("id", "project_id", "mail_type", "variant", "subject", "content", "use_layout", "reply_to", "trusted")
					values (?, ?, ?, ?, ?, ?, ?, ?, ?)
					on conflict ("project_id", "mail_type", "variant") where "project_id" is not null
					do update set "reply_to" = "excluded"."reply_to", "subject" = "excluded"."subject", "content" = "excluded"."content", "use_layout" = "excluded"."use_layout", "trusted" = "excluded"."trusted"`,
				parameters: [anyString, PROJECT_ID, 'passwordReset', '', 'Reset', '{{token}}', true, null, trusted],
				response: { rowCount: 1 },
			},
		],
		expectedAuthLog: {
			type: 'mail_template_change',
			response: expect.anything(),
			eventData: { action: 'add', projectSlug: 'blog', mailType: 'RESET_PASSWORD_REQUEST', variant: '' },
		},
		return: { data: { addMailTemplate: { ok: true } } },
	})

test('a project template written by a global admin is trusted', async () => {
	await addTemplate(['project_admin'], true)
})

test('a project template written by a project-scoped admin is untrusted', async () => {
	await addTemplate(['person'], false)
})
