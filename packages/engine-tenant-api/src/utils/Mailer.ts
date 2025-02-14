import { createTransport, Transporter, TransportOptions } from 'nodemailer'
import * as SMTPTransport from 'nodemailer/lib/smtp-transport'
import * as SMTPPool from 'nodemailer/lib/smtp-pool'
import * as SendmailTransport from 'nodemailer/lib/sendmail-transport'
import * as SESTransport from 'nodemailer/lib/ses-transport'
import { logger } from '@contember/logger'
import { MailTemplateIdentifier } from '../model'

export interface MailMessage {
	to: string
	subject: string
	html: string
	from?: string
	replyTo?: string
	variables?: Record<string, any>
	template?: MailTemplateIdentifier
}

export interface SentInfo {
	error?: any
	messageId?: string
	envelope?: any
	accepted?: string[]
	rejected?: string[]
	pending?: string[]
}

export type MailerOptions =
	& (
		SMTPTransport.Options | SMTPPool.Options | SendmailTransport.Options | SESTransport.Options | TransportOptions
		| {
			webhook: string | {
				url: string
				headers?: Record<string, string>
			}
		}
	)
	& {
		from?: string
	}


export interface Mailer {
	send(message: MailMessage): Promise<SentInfo>
}

export class NodeMailer implements Mailer {
	constructor(private readonly from: string | undefined, private readonly transport: Transporter) {}

	public async send({ variables, template, ...message }: MailMessage): Promise<SentInfo> {
		try {
			return await this.transport.sendMail({ ...message, from: message.from || this.from })
		} catch (e) {
			logger.error(e, { message: 'Mail sending failed', mail: message })
			return { error: e }
		}
	}
}

export class WebhookMailer implements Mailer {

	constructor(
		private readonly from: string | undefined,
		private readonly url: string,
		private readonly headers: Record<string, string> = {},
	) {
	}

	public async send(message: MailMessage): Promise<SentInfo> {
		const response = await fetch(this.url, {
			method: 'POST',
			body: JSON.stringify({ ...message, from: message.from || this.from }),
			headers: {
				...this.headers,
				'Content-Type': 'application/json',
			},
		})
		if (!response.ok) {
			logger.error('Mail sending failed', { mail: message, response })
			return { error: response.statusText }
		}
		await response.text()
		return {}
	}
}


export const createMailer = (options: MailerOptions): Mailer => {
	const { from, ...transportOptions } = options
	if ('webhook' in transportOptions) {
		const config = typeof transportOptions.webhook === 'string' ? { url: transportOptions.webhook } : transportOptions.webhook
		return new WebhookMailer(from, config.url, config.headers)
	}

	return new NodeMailer(from, createTransport(transportOptions as any))
}
