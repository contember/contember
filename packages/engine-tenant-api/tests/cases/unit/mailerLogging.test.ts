import { expect, test } from 'bun:test'
import { createTransport } from 'nodemailer'
import { createLogger, TestLoggerHandler } from '@contember/logger'
import { MailMessage, NodeMailer, WebhookMailer } from '../../../src/utils/Mailer.js'
import { MailType } from '../../../src/model/mailing/type.js'

const message: MailMessage = {
	to: 'john@example.com',
	subject: 'Password reset',
	html: '<a href="https://example.com/reset?token=reset-token-value">Reset</a>',
	variables: { email: 'john@example.com', token: 'reset-token-value', url: 'https://example.com/reset?token=reset-token-value' },
	template: { type: MailType.passwordReset, projectId: null, variant: '' },
}

const loggedText = (handler: TestLoggerHandler): string => JSON.stringify(handler.messages.map(it => [it.message, it.ownAttributes]))

const maskedMail = {
	...message,
	html: '<a href="https://example.com/reset?token=[redacted]">Reset</a>',
	variables: { email: 'john@example.com', token: '[redacted]', url: 'https://example.com/reset?token=[redacted]' },
}

test('a failed SMTP delivery logs the mail with its token masked', async () => {
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
	expect(handler.messages[0].ownAttributes.mail).toEqual(maskedMail)
	expect(loggedText(handler)).not.toContain('reset-token-value')
})

test('a failed webhook delivery logs the mail with its token masked', async () => {
	const originalFetch = globalThis.fetch
	globalThis.fetch = Object.assign(async () => new Response(null, { status: 502 }), { preconnect: originalFetch.preconnect })
	try {
		const handler = new TestLoggerHandler()
		const mailer = new WebhookMailer('engine@example.com', 'https://mail.example.com/send')
		const result = await createLogger(handler).scope(() => mailer.send(message))

		expect(result.error).toBeDefined()
		expect(handler.messages).toHaveLength(1)
		expect(handler.messages[0].ownAttributes.mail).toEqual(maskedMail)
		expect(loggedText(handler)).not.toContain('reset-token-value')
	} finally {
		globalThis.fetch = originalFetch
	}
})

test('a logged mail masks a secret also where the template rendered it HTML-escaped, URL- or form-encoded', async () => {
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
	const invite: MailMessage = {
		...message,
		html: '<td>ab&#x2F;cd+ef&#x3D;</td><a href="https://example.com/?p=ab%2Fcd%2Bef%3D">Sign in</a><a href="https://x/?t=a+b%21c">Link</a>',
		variables: { email: 'john@example.com', password: 'ab/cd+ef=', token: 'a b!c' },
	}
	await createLogger(handler).scope(() => new NodeMailer('engine@example.com', transport).send(invite))

	expect(loggedText(handler)).not.toMatch(/ab&#x2F;cd|ab%2Fcd|ab\/cd|a\+b%21c/)
})
