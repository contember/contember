import { MutationResetPersonMfaArgs, MutationResolvers, ResetPersonMfaResponse } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { BackupCodeManager, lockTargetIdentityPermissionTarget, PermissionActions } from '../../../model/index.js'
import { PersonManager } from '../../../model/service/PersonManager.js'
import { ResetPersonMfaCommand } from '../../../model/commands/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { ResponseError, ResponseOk } from '../../../model/utils/Response.js'

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
		return await context.db.transaction(async db => {
			const targetPerson = await this.personManager.findPersonById(db, args.personId)

			const target = targetPerson === null ? null : await lockTargetIdentityPermissionTarget(db, targetPerson.identity_id)
			await context.requireAccess({
				action: PermissionActions.PERSON_RESET_MFA(target),
				message: 'You are not allowed to reset MFA for this person',
			})

			if (targetPerson === null) {
				const response = new ResponseError('PERSON_NOT_FOUND', `Person <${args.personId}> was not found`)
				await context.logAuthAction({
					type: 'mfa_reset',
					response,
					metadata: { requestedPersonId: args.personId },
				}, db)
				return createErrorResponse(response.error, response.errorMessage)
			}

			await db.commandBus.execute(new ResetPersonMfaCommand(targetPerson.id))
			await this.backupCodeManager.deleteForPerson(db, targetPerson.id)

			await context.logAuthAction({
				type: 'mfa_reset',
				response: new ResponseOk(null),
				targetPersonId: targetPerson.id,
			}, db)

			return { ok: true }
		}, { isolation: 'readCommitted' })
	}
}
