import { expect, test } from 'bun:test'
import { createTransport } from 'nodemailer'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { MailMessage, NodeMailer, WebhookMailer } from '../../../src/utils/Mailer.js'
import { MailType } from '../../../src/model/mailing/type.js'

const message: MailMessage = {
	to: 'john@example.com',
	subject: 'Password reset',
	html: '<a href="https://example.com/reset?token=reset-token-value">Reset</a>',
	variables: { email: 'john@example.com', token: 'reset-token-value' },
	template: { type: MailType.passwordReset, projectId: null, variant: '' },
}

const loggedText = (handler: TestLoggerHandler): string => JSON.stringify(handler.messages.map(it => [it.message, it.ownAttributes]))

test('a failed SMTP delivery logs the template, not the rendered mail', async () => {
	const handler = new TestLoggerHandler()
	const transport = createTransport({
		name: 'failing',
		version: '1',
		send: (_mail, callback) =>
			callback(new Error('SMTP unavailable'), {
				envelope: { from: false, to: [] },
				messageId: '',
				accepted: [],
				rejected: [],
				pending: [],
				response: '',
			}),
	})
	const result = await createLogger(handler).scope(() => new NodeMailer('engine@example.com', transport).send(message))

	expect(result.error).toBeInstanceOf(Error)
	expect(handler.messages).toHaveLength(1)
	expect(handler.messages[0].ownAttributes.template).toEqual(message.template)
	expect(loggedText(handler)).not.toContain('reset-token-value')
	expect(loggedText(handler)).not.toContain('john@example.com')
})

test('a failed webhook delivery logs the template and status, not the mail or its variables', async () => {
	const originalFetch = globalThis.fetch
	globalThis.fetch = Object.assign(async () => new Response(null, { status: 502 }), { preconnect: originalFetch.preconnect })
	try {
		const handler = new TestLoggerHandler()
		const mailer = new WebhookMailer('engine@example.com', 'https://mail.example.com/send')
		const result = await createLogger(handler).scope(() => mailer.send(message))

		expect(result.error).toBeDefined()
		expect(handler.messages).toHaveLength(1)
		expect(handler.messages[0].ownAttributes).toMatchObject({ template: message.template, status: 502 })
		expect(loggedText(handler)).not.toContain('reset-token-value')
		expect(loggedText(handler)).not.toContain('john@example.com')
	} finally {
		globalThis.fetch = originalFetch
	}
})
