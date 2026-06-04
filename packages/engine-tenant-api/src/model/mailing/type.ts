import { MailType as SchemaMailType } from '../../schema/index.js'

export enum MailType {
	existingUserInvited = 'existingUserInvited',
	newUserInvited = 'newUserInvited',
	passwordReset = 'passwordReset',
	passwordlessSignIn = 'passwordlessSignIn',
	forcedSignOut = 'forcedSignOut',
	emailOtp = 'emailOtp',
	backupCodesExhausted = 'backupCodesExhausted',
	emailVerification = 'emailVerification',
	emailChangeVerify = 'emailChangeVerify',
	emailChangeNotify = 'emailChangeNotify',
}

export const mailTypeFromSchemaToDb = (type: SchemaMailType): MailType => {
	return {
		EXISTING_USER_INVITED: MailType.existingUserInvited,
		NEW_USER_INVITED: MailType.newUserInvited,
		RESET_PASSWORD_REQUEST: MailType.passwordReset,
		PASSWORDLESS_SIGN_IN: MailType.passwordlessSignIn,
		FORCED_SIGN_OUT: MailType.forcedSignOut,
		EMAIL_OTP: MailType.emailOtp,
		BACKUP_CODES_EXHAUSTED: MailType.backupCodesExhausted,
		EMAIL_VERIFICATION: MailType.emailVerification,
		EMAIL_CHANGE_VERIFY: MailType.emailChangeVerify,
		EMAIL_CHANGE_NOTIFY: MailType.emailChangeNotify,
	}[type]
}

export const mailTypeFromDbToSchema = (type: MailType): SchemaMailType => {
	return {
		[MailType.existingUserInvited]: 'EXISTING_USER_INVITED' as const,
		[MailType.newUserInvited]: 'NEW_USER_INVITED' as const,
		[MailType.passwordReset]: 'RESET_PASSWORD_REQUEST' as const,
		[MailType.passwordlessSignIn]: 'PASSWORDLESS_SIGN_IN' as const,
		[MailType.forcedSignOut]: 'FORCED_SIGN_OUT' as const,
		[MailType.emailOtp]: 'EMAIL_OTP' as const,
		[MailType.backupCodesExhausted]: 'BACKUP_CODES_EXHAUSTED' as const,
		[MailType.emailVerification]: 'EMAIL_VERIFICATION' as const,
		[MailType.emailChangeVerify]: 'EMAIL_CHANGE_VERIFY' as const,
		[MailType.emailChangeNotify]: 'EMAIL_CHANGE_NOTIFY' as const,
	}[type]
}

export interface MailTemplateIdentifier {
	projectId: string | null
	type: MailType
	variant: string
}

export interface MailTemplateData {
	subject: string
	content: string
	useLayout: boolean
	replyTo: string | null
}

export interface MailTemplate extends MailTemplateIdentifier, MailTemplateData {}
