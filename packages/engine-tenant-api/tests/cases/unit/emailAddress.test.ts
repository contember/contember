import { describe, expect, test } from 'bun:test'
import { createTransport } from 'nodemailer'
import { EmailAddress } from '../../../src/model/utils/email'
import { NodeMailer } from '../../../src/utils'

describe('EmailAddress.parse', () => {
	test('drops surrounding whitespace and keeps case', () => {
		expect(EmailAddress.parse('  John@Doe.com\n')?.value).toBe('John@Doe.com')
	})

	test('refuses whitespace inside the address instead of stripping it', () => {
		expect(EmailAddress.parse('big boss123@gmail.com')).toBeNull()
		expect(EmailAddress.parse('boss123@gmail.com\tx')).toBeNull()
	})

	test('refuses an empty input', () => {
		expect(EmailAddress.parse('   ')).toBeNull()
	})

	test('normalizes to the stored form', () => {
		expect(EmailAddress.parse('John@Doe.com')?.normalized().value).toBe('john@doe.com')
	})
})

describe('NodeMailer recipient', () => {
	const envelopeRecipients = async (to: string): Promise<string[]> => {
		const transport = createTransport({ jsonTransport: true })
		const info = await new NodeMailer('engine@example.com', transport).send({ to, subject: 'Sign in', html: '' })
		return info.envelope.to
	}

	test('is not parsed as an address list', async () => {
		expect(await envelopeRecipients('big boss123@gmail.com')).toEqual(['"big boss123"@gmail.com'])
		expect(await envelopeRecipients('someone,boss123@gmail.com')).toEqual(['someone,boss123@gmail.com'])
	})

	test('is delivered to as given', async () => {
		expect(await envelopeRecipients('john@doe.com')).toEqual(['john@doe.com'])
	})
})
