import { createTransport, Transporter, TransportOptions } from 'nodemailer'
import * as SMTPTransport from 'nodemailer/lib/smtp-transport'
import * as SMTPPool from 'nodemailer/lib/smtp-pool'
import * as SendmailTransport from 'nodemailer/lib/sendmail-transport'
import * as SESTransport from 'nodemailer/lib/ses-transport'
import { logger } from '@contember/logger'
import mustache from 'mustache'
import { MailTemplateIdentifier } from '../model/index.js'
import { maskSecrets, REDACTED, SECRET_FIELD_NAMES } from './secretMasking.js'

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
		SMTPTransport.Options | SMTPPool.Options | SendmailTransport.Options | SESTransport.Options | TransportOptions | {
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

/**
 * The mail as it may be logged: secret variables are masked, and so is each of their values wherever the rendered
 * subject, body or another variable (e.g. a link) repeats it, raw, HTML-escaped or URL-encoded.
 */
export const maskMailMessage = (message: MailMessage): MailMessage => {
	// A template renders a value HTML-escaped and a link may carry it URL- or form-encoded; each form is masked, longest first.
	const secretValues = [
		...new Set(
			Object.entries(message.variables ?? {})
				.flatMap(([key, value]) => SECRET_FIELD_NAMES.has(key) && typeof value === 'string' && value !== '' ? [value] : [])
				.flatMap(value => [value, encodeURIComponent(value), new URLSearchParams({ v: value }).toString().slice(2)])
				.flatMap(value => [value, mustache.escape(value)]),
		),
	].sort((a, b) => b.length - a.length)
	const maskText = (text: string): string => secretValues.reduce((masked, secret) => masked.replaceAll(secret, REDACTED), text)
	return {
		...message,
		subject: maskText(message.subject),
		html: maskText(message.html),
		variables: message.variables === undefined
			? undefined
			: Object.fromEntries(
				Object.entries(message.variables).map(([key, value]) => [key, SECRET_FIELD_NAMES.has(key) ? REDACTED : maskSecrets(value, false, maskText)]),
			),
	}
}

export class NodeMailer implements Mailer {
	constructor(private readonly from: string | undefined, private readonly transport: Transporter) {}

	public async send({ variables, template, ...message }: MailMessage): Promise<SentInfo> {
		try {
			// An address object is not parsed: as a string, `big boss@example.com` would go to `boss@example.com`.
			return await this.transport.sendMail({ ...message, to: { name: '', address: message.to }, from: message.from || this.from })
		} catch (e) {
			logger.error(e, { message: 'Mail sending failed', mail: maskMailMessage({ ...message, variables, template }) })
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
			logger.error('Mail sending failed', { mail: maskMailMessage(message), response })
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
