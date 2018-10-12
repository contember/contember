import MeQueryResolver from './query/MeQueryResolver'
import SignUpMutationResolver from './mutation/SignUpMutationResolver'
import SignInMutationResolver from './mutation/SignInMutationResolver'
import AddProjectMemberMutationResolver from './mutation/AddProjectMemberMutationResolver'
import { Config } from 'apollo-server-core'

class ResolverFactory {
	public constructor(
		private meQueryResolver: MeQueryResolver,
		private signUpMutationResolver: SignUpMutationResolver,
		private signInMutationResolver: SignInMutationResolver,
		private addProjectMemberMutationResolver: AddProjectMemberMutationResolver
	) {}

	create(): Config['resolvers'] {
		return {
			Query: {
				me: this.meQueryResolver.me.bind(this.meQueryResolver),
			},
			Mutation: {
				signUp: this.signUpMutationResolver.signUp.bind(this.signUpMutationResolver),
				signIn: this.signInMutationResolver.signIn.bind(this.signInMutationResolver),
				addProjectMember: this.addProjectMemberMutationResolver.addProjectMember.bind(
					this.addProjectMemberMutationResolver
				),
			},
		}
	}
}

export default ResolverFactory
