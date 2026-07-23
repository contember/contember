import { DisablePersonResponse, MutationDisablePersonArgs, MutationResolvers } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { lockTargetIdentityPermissionTarget, PermissionActions, PersonAccessManager } from '../../../model/index.js'
import { PersonManager } from '../../../model/service/PersonManager.js'
import { createErrorResponse } from '../../errorUtils.js'

export class DisablePersonMutationResolver implements MutationResolvers {
	constructor(
		private readonly personAccessManager: PersonAccessManager,
		private readonly personManager: PersonManager,
	) {}

	async disablePerson(
		parent: any,
		args: MutationDisablePersonArgs,
		context: TenantResolverContext,
	): Promise<DisablePersonResponse> {
		return await context.db.transaction(async db => {
			const targetPerson = await this.personManager.findPersonById(db, args.personId)

			if (targetPerson === null) {
				return {
					ok: false,
					error: {
						code: 'PERSON_NOT_FOUND',
						developerMessage: `Person <${args.personId}> was not found`,
					},
				}
			}

			const target = await lockTargetIdentityPermissionTarget(db, targetPerson.identity_id)
			await context.requireAccess({
				action: PermissionActions.PERSON_DISABLE(target),
				message: 'You are not allowed to disable person account',
			})

			const result = await this.personAccessManager.disablePersonInTransaction(db, targetPerson)
			await context.logAuthAction({
				type: 'person_disable',
				response: result,
				personId: targetPerson.id,
			}, db)
			if (!result.ok) {
				return createErrorResponse(result.error, result.errorMessage)
			}

			return {
				ok: true,
			}
		}, { isolation: 'readCommitted' })
	}
}
