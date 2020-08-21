export enum MailType {
	existingUserInvited = 'existingUserInvited',
	newUserInvited = 'newUserInvited',
}

export interface MailTemplateIdentifier {
	projectId: string
	type: MailType
	variant: string
}

export interface MailTemplateData {
	subject: string
	content: string
	useLayout: boolean
}

export interface MailTemplate extends MailTemplateIdentifier, MailTemplateData {}
