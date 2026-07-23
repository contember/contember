import { test } from 'bun:test'
import { executeTenantTest } from '../../../src/testTenant.js'
import { GQL, SQL } from '../../../src/tags.js'

test('mailTemplates filters mixed global and project rows through exact scope metadata', async () => {
	await executeTenantTest({
		query: GQL`query {
			mailTemplates { projectSlug type variant subject }
		}`,
		executes: [
			{
				sql:
					SQL`select "mail_template"."id", "subject", "content", "use_layout" as "useLayout", "reply_to" as "replyTo", "project_id" as "projectId", "mail_type" as "type", "variant", "project"."slug" as "projectSlug"  from "tenant"."mail_template" left join  "tenant"."project" on  "project"."id" = "mail_template"."project_id"`,
				parameters: [],
				response: {
					rows: [
						{
							id: 'global-forced',
							subject: 'Global forced',
							content: 'content',
							useLayout: true,
							replyTo: null,
							projectId: null,
							type: 'forcedSignOut',
							variant: '',
							projectSlug: null,
						},
						{
							id: 'blog-forced',
							subject: 'Blog forced',
							content: 'content',
							useLayout: true,
							replyTo: null,
							projectId: 'blog-id',
							type: 'forcedSignOut',
							variant: '',
							projectSlug: 'blog',
						},
						{
							id: 'shop-forced',
							subject: 'Shop forced',
							content: 'content',
							useLayout: true,
							replyTo: null,
							projectId: 'shop-id',
							type: 'forcedSignOut',
							variant: '',
							projectSlug: 'shop',
						},
						{
							id: 'blog-password',
							subject: 'Blog password',
							content: 'content',
							useLayout: true,
							replyTo: null,
							projectId: 'blog-id',
							type: 'passwordReset',
							variant: '',
							projectSlug: 'blog',
						},
					],
				},
			},
		],
		authorizator: {
			isAllowed: (_identity, _scope, action) => {
				if (action.resource !== 'mailTemplate' || action.privilege !== 'list') {
					return Promise.resolve(false)
				}
				const meta = action.meta
				if (meta === undefined || !('kind' in meta)) {
					return Promise.resolve(false)
				}
				if (meta.kind === 'any') {
					return Promise.resolve(true)
				}
				return Promise.resolve(
					meta.kind === 'project'
						&& meta.projectSlug === 'blog'
						&& meta.type === 'FORCED_SIGN_OUT',
				)
			},
		},
		return: {
			data: {
				mailTemplates: [{
					projectSlug: 'blog',
					type: 'FORCED_SIGN_OUT',
					variant: null,
					subject: 'Blog forced',
				}],
			},
		},
	})
})
