import { ForceSignOutPersonResponse, MutationForceSignOutPersonArgs, MutationResolvers } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { ApiKeyManager, lockTargetIdentityPermissionTarget, PermissionActions } from '../../../model/index.js'
import { PersonManager } from '../../../model/service/PersonManager.js'
import { createErrorResponse } from '../../errorUtils.js'
import { ResponseError, ResponseOk } from '../../../model/utils/Response.js'
import { UserMailer } from '../../../model/mailing/index.js'

export class ForceSignOutMutationResolver implements Pick<MutationResolvers, 'forceSignOutPerson'> {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly personManager: PersonManager,
		private readonly userMailer: UserMailer,
	) {}

	async forceSignOutPerson(
		parent: unknown,
		args: MutationForceSignOutPersonArgs,
		context: TenantResolverContext,
	): Promise<ForceSignOutPersonResponse> {
		const reason = args.reason ?? null
		const result = await context.db.transaction(async db => {
			const targetPerson = await this.personManager.findPersonById(db, args.personId)
			const target = targetPerson === null ? null : await lockTargetIdentityPermissionTarget(db, targetPerson.identity_id)
			await context.requireAccess({
				action: PermissionActions.PERSON_FORCE_SIGN_OUT(target),
				message: 'You are not allowed to force sign out this person',
			})

			if (targetPerson === null) {
				const response = new ResponseError('PERSON_NOT_FOUND', `Person <${args.personId}> was not found`)
				await context.logAuthAction({
					type: 'forced_sign_out',
					response,
					metadata: {
						requestedPersonId: args.personId,
						...(reason !== null ? { reason } : {}),
					},
				}, db)
				return { response: createErrorResponse(response.error, response.errorMessage), targetPerson: null }
			}

			await this.apiKeyManager.disableIdentityApiKeys(db, targetPerson.identity_id)

			const response = new ResponseOk(null)
			await context.logAuthAction({
				type: 'forced_sign_out',
				response,
				targetPersonId: targetPerson.id,
				metadata: reason !== null ? { reason } : undefined,
			}, db)
			return { response: { ok: true }, targetPerson }
		}, { isolation: 'readCommitted' })

		if (result.targetPerson?.email) {
			await this.userMailer.sendForcedSignOutEmail(
				context.db,
				{ email: result.targetPerson.email, reason },
				{ projectId: null, variant: '' },
			)
		}

		return result.response
	}
}
