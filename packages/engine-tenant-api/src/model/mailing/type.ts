export enum MailType {
	existingUserInvited = 'existingUserInvited',
	newUserInvited = 'newUserInvited',
	passwordReset = 'passwordReset',
}

export interface MailTemplateIdentifier {
	projectId?: string
	type: MailType
	variant: string
}

export interface MailTemplateData {
	subject: string
	content: string
	useLayout: boolean
	replyTo?: string | null
}

export interface MailTemplate extends MailTemplateIdentifier, MailTemplateData {}
