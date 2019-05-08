import { MutationResolvers, MutationSignInArgs, SignInResponse } from '../../../schema/types'
import ResolverContext from '../../ResolverContext'
import SignInManager from '../../../model/service/SignInManager'
import Actions from '../../../model/authorization/Actions'

export default class SignInMutationResolver implements MutationResolvers {
	constructor(private readonly signInManager: SignInManager) {}

	async signIn(parent: any, args: MutationSignInArgs, context: ResolverContext): Promise<SignInResponse> {
		await context.requireAccess({
			action: Actions.PERSON_SIGN_IN,
			message: 'You are not allowed to sign in',
		})

		const result = await this.signInManager.signIn(args.email, args.password, args.expiration || undefined)

		if (!result.ok) {
			return {
				ok: false,
				errors: result.errors.map(errorCode => ({ code: errorCode })),
			}
		}

		return {
			ok: true,
			errors: [],
			result: {
				token: result.token,
				person: {
					id: result.person.id,
					email: result.person.email,
					identity: {
						id: result.person.identity_id,
						projects: [],
					},
				},
			},
		}
	}
}
