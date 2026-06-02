import { MutationResolvers, RegenerateBackupCodesResponse } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { BackupCodeManager, PermissionActions, PersonQuery, PersonRow } from '../../../model/index.js'
import { ImplementationException } from '../../../exceptions.js'
import { createErrorResponse } from '../../errorUtils.js'
import { ResponseOk } from '../../../model/utils/Response.js'

export class RegenerateBackupCodesMutationResolver implements Pick<MutationResolvers, 'regenerateBackupCodes'> {
	constructor(private readonly backupCodeManager: BackupCodeManager) {}

	async regenerateBackupCodes(parent: any, args: {}, context: TenantResolverContext): Promise<RegenerateBackupCodesResponse> {
		const person = await this.getPersonFromContext(context)
		// Backup codes only exist alongside an active TOTP factor.
		if (!person.otp_secret || !person.otp_activated_at) {
			return createErrorResponse('OTP_NOT_ACTIVE', 'OTP is not active, you cannot regenerate backup codes.')
		}
		const backupCodes = await this.backupCodeManager.generate(context.db, person.id)
		await context.logAuthAction({
			type: 'backup_code_regenerated',
			response: new ResponseOk(null),
			personId: person.id,
		})
		return {
			ok: true,
			result: {
				backupCodes,
			},
		}
	}

	private async getPersonFromContext(context: TenantResolverContext): Promise<PersonRow> {
		await context.requireAccess({
			action: PermissionActions.PERSON_SETUP_OTP,
			message: 'You are not allowed to setup a OTP',
		})
		const person = await context.db.queryHandler.fetch(PersonQuery.byIdentity(context.identity.id))
		if (!person) {
			throw new ImplementationException('Person should exists')
		}

		return person
	}
}
