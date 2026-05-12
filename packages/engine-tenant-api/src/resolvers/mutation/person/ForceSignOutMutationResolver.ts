import { ForceSignOutPersonResponse, MutationForceSignOutPersonArgs, MutationResolvers } from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { ApiKeyManager, PermissionActions } from '../../../model'
import { PersonManager } from '../../../model/service/PersonManager'
import { createErrorResponse } from '../../errorUtils'
import { ResponseError, ResponseOk } from '../../../model/utils/Response'
import { UserMailer } from '../../../model/mailing'

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
		const targetPerson = await this.personManager.findPersonById(context.db, args.personId)
		const reason = args.reason ?? null

		await context.requireAccess({
			action: PermissionActions.PERSON_FORCE_SIGN_OUT(targetPerson?.roles ?? []),
			message: 'You are not allowed to force sign out this person',
		})

		if (targetPerson === null) {
			const response = new ResponseError('PERSON_NOT_FOUND', `Person <${args.personId}> was not found`)
			await context.logAuthAction({
				type: 'forced_sign_out',
				response,
				targetPersonId: args.personId,
				metadata: reason !== null ? { reason } : undefined,
			})
			return createErrorResponse(response.error, response.errorMessage)
		}

		await this.apiKeyManager.disableIdentityApiKeys(context.db, targetPerson.identity_id)

		const response = new ResponseOk(null)
		await context.logAuthAction({
			type: 'forced_sign_out',
			response,
			targetPersonId: targetPerson.id,
			metadata: reason !== null ? { reason } : undefined,
		})

		if (targetPerson.email) {
			await this.userMailer.sendForcedSignOutEmail(
				context.db,
				{ email: targetPerson.email, reason },
				{ projectId: null, variant: '' },
			)
		}

		return { ok: true }
	}
}
