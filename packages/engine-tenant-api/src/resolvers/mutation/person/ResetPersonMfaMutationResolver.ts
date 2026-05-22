import { MutationResetPersonMfaArgs, MutationResolvers, ResetPersonMfaResponse } from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { BackupCodeManager, PermissionActions } from '../../../model'
import { PersonManager } from '../../../model/service/PersonManager'
import { ResetPersonMfaCommand } from '../../../model/commands'
import { createErrorResponse } from '../../errorUtils'
import { ResponseError, ResponseOk } from '../../../model/utils/Response'

/**
 * Admin recovery for a locked-out user: clears the target person's MFA factors
 * (active + pending TOTP, email OTP), deletes their backup codes, and clears the
 * grace anchor, so they can re-enroll. Permission mirrors `forceSignOutPerson`
 * (A21): PROJECT_ADMIN with the role-escalation verifier, plus SUPER_ADMIN.
 * Audits `mfa_reset`.
 */
export class ResetPersonMfaMutationResolver implements Pick<MutationResolvers, 'resetPersonMfa'> {
	constructor(
		private readonly personManager: PersonManager,
		private readonly backupCodeManager: BackupCodeManager,
	) {}

	async resetPersonMfa(parent: unknown, args: MutationResetPersonMfaArgs, context: TenantResolverContext): Promise<ResetPersonMfaResponse> {
		const targetPerson = await this.personManager.findPersonById(context.db, args.personId)

		await context.requireAccess({
			action: PermissionActions.PERSON_RESET_MFA(targetPerson?.roles ?? []),
			message: 'You are not allowed to reset MFA for this person',
		})

		if (targetPerson === null) {
			const response = new ResponseError('PERSON_NOT_FOUND', `Person <${args.personId}> was not found`)
			await context.logAuthAction({
				type: 'mfa_reset',
				response,
				metadata: { requestedPersonId: args.personId },
			})
			return createErrorResponse(response.error, response.errorMessage)
		}

		await context.db.commandBus.execute(new ResetPersonMfaCommand(targetPerson.id))
		await this.backupCodeManager.deleteForPerson(context.db, targetPerson.id)

		await context.logAuthAction({
			type: 'mfa_reset',
			response: new ResponseOk(null),
			targetPersonId: targetPerson.id,
		})

		return { ok: true }
	}
}
