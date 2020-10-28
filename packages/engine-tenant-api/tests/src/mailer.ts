import { Mailer, MailMessage, SentInfo } from '../../src/utils'
import * as assert from 'uvu/assert'

export type ExpectedMessage = { subject: string }

export type MockedMailer = Mailer & {
	expectMessage: (message: ExpectedMessage) => MailMessage
	expectEmpty: () => void
}
export const createMockedMailer = (): MockedMailer => {
	const mails: MailMessage[] = []
	return new (class implements Mailer {
		async send(message: MailMessage): Promise<SentInfo> {
			mails.push(message)
			return {}
		}

		expectMessage(expected: ExpectedMessage) {
			const actual = mails.shift()
			assert.ok(actual)
			if (!actual) {
				throw new Error('No email to consume')
			}
			assert.equal(actual.subject, expected.subject)
			return actual
		}

		expectEmpty() {
			assert.equal(mails.length, 0)
		}
	})()
}
