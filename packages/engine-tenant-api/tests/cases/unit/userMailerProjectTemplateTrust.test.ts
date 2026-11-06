import { describe, expect, test } from 'bun:test'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { DatabaseContext, Providers, TemplateRenderer, UserMailer } from '../../../src/index.js'
import { createMockedMailer } from '../../src/mailer.js'

const PROJECT_ID = '123e4567-e89b-12d3-a456-000000000001'
const IDENTITY_ID = '123e4567-e89b-12d3-a456-000000000002'

const providers: Providers = {
	bcrypt: () => Promise.resolve('x'),
	bcryptCompare: () => Promise.resolve(true),
	now: () => new Date('2026-11-06T12:00:00.000Z'),
	randomBytes: bytes => Promise.resolve(Buffer.alloc(bytes)),
	uuid: () => 'uuid',
	decrypt: () => {
		throw new Error('not supported')
	},
	encrypt: () => {
		throw new Error('not supported')
	},
	encryptionEnabled: false,
	hash: value => Buffer.from(value.toString()),
}

const templateRow = (subject: string, projectId: string | null, trusted: boolean) => ({
	id: subject,
	subject,
	content: 'reset {{token}}',
	useLayout: false,
	replyTo: null,
	projectId,
	type: 'passwordReset',
	variant: '',
	trusted,
})

const projectTemplateSql = (trusted: boolean): ExpectedQuery => ({
	sql:
		'select "mail_template"."id", "subject", "content", "use_layout" as "useLayout", "reply_to" as "replyTo", "project_id" as "projectId", "mail_type" as "type", "variant", "trusted" from "tenant"."mail_template" where "project_id" = ? and "mail_type" = ? and "variant" = ?',
	parameters: [PROJECT_ID, 'passwordReset', ''],
	response: { rows: [templateRow('Project reset', PROJECT_ID, trusted)] },
})

const globalTemplateSql: ExpectedQuery = {
	sql:
		'select "mail_template"."id", "subject", "content", "use_layout" as "useLayout", "reply_to" as "replyTo", "project_id" as "projectId", "mail_type" as "type", "variant", "trusted" from "tenant"."mail_template" where "project_id" is null and "mail_type" = ? and "variant" = ?',
	parameters: ['passwordReset', ''],
	response: { rows: [templateRow('Global reset', null, true)] },
}

const identitySql = (roles: string[]): ExpectedQuery => ({
	sql: 'select "id", "description", "roles" from "tenant"."identity" where "id" in (?)',
	parameters: [IDENTITY_ID],
	response: { rows: [{ id: IDENTITY_ID, description: null, roles }] },
})

const sendPasswordReset = async (queries: ExpectedQuery[], recipientIdentityId: string | null = IDENTITY_ID): Promise<string> => {
	const connection = createConnectionMock(queries)
	const db = new DatabaseContext(connection.createClient('tenant', { module: 'tenant' }), providers)
	const mailer = createMockedMailer()
	await new UserMailer(mailer, new TemplateRenderer()).sendPasswordResetEmail(
		db,
		{ email: 'john@doe.com' },
		{ token: 'abc' },
		{ projectId: PROJECT_ID, variant: '', recipientIdentityId },
	)
	const message = mailer.expectMessage({ subject: expect.any(String) })
	mailer.expectEmpty()
	return message.subject
}

describe('project mail template trust', () => {
	test('an untrusted project template is not sent to a global project admin', async () => {
		expect(await sendPasswordReset([projectTemplateSql(false), identitySql(['person', 'project_admin']), globalTemplateSql])).toBe('Global reset')
	})

	test('an untrusted project template is not sent to a super admin', async () => {
		expect(await sendPasswordReset([projectTemplateSql(false), identitySql(['super_admin']), globalTemplateSql])).toBe('Global reset')
	})

	test('an untrusted project template is not sent to an unknown recipient', async () => {
		expect(await sendPasswordReset([projectTemplateSql(false), globalTemplateSql], null)).toBe('Global reset')
	})

	test('an untrusted project template is sent to a person without a global admin role', async () => {
		expect(await sendPasswordReset([projectTemplateSql(false), identitySql(['person'])])).toBe('Project reset')
	})

	test('a trusted project template is sent to a global admin', async () => {
		expect(await sendPasswordReset([projectTemplateSql(true)])).toBe('Project reset')
	})
})
