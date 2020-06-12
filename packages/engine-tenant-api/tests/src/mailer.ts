import { Mailer, MailMessage, SentInfo } from '../../src/utils'

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
			expect(actual).not.toBeUndefined()
			if (!actual) {
				throw new Error('No email to consume')
			}
			expect(actual.subject).toEqual(expected.subject)
			return actual
		}

		expectEmpty() {
			expect(mails.length).toEqual(0)
		}
	})()
}
