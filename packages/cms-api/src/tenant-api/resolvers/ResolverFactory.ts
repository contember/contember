import { Config } from 'apollo-server-core'

import MeQueryResolver from './query/MeQueryResolver'

import SignUpMutationResolver from './mutation/person/SignUpMutationResolver'
import SignInMutationResolver from './mutation/person/SignInMutationResolver'
import AddProjectMemberMutationResolver from './mutation/projectMember/AddProjectMemberMutationResolver'
import SetupMutationResolver from './mutation/setup/SetupMutationResolver'
import CreateApiKeyMutationResolver from './mutation/apiKey/CreateApiKeyMutationResolver'
import ChangePasswordMutationResolver from './mutation/person/ChangePasswordMutationResolver'
import SignOutMutationResolver from './mutation/person/SignOutMutationResolver'
import UpdateProjectMemberMutationResolver from './mutation/projectMember/UpdateProjectMemberMutationResolver'
import RemoveProjectMemberMutationResolver from './mutation/projectMember/RemoveProjectMemberMutationResolver'
import DisableApiKeyMutationResolver from './mutation/apiKey/DisableApiKeyMutationResolver'

class ResolverFactory {
	public constructor(
		private readonly resolvers: {
			meQueryResolver: MeQueryResolver

			setupMutationResolver: SetupMutationResolver

			signUpMutationResolver: SignUpMutationResolver
			signInMutationResolver: SignInMutationResolver
			signOutMutationResolver: SignOutMutationResolver
			changePasswordMutationResolver: ChangePasswordMutationResolver

			addProjectMemberMutationResolver: AddProjectMemberMutationResolver
			updateProjectMemberMutationResolver: UpdateProjectMemberMutationResolver
			removeProjectMemberMutationResolver: RemoveProjectMemberMutationResolver

			createApiKeyMutationResolver: CreateApiKeyMutationResolver
			disableApiKeyMutationResolver: DisableApiKeyMutationResolver
		}
	) {}

	create(): Config['resolvers'] {
		return {
			Query: {
				me: this.resolvers.meQueryResolver.me.bind(this.resolvers.meQueryResolver),
			},
			Mutation: {
				setup: this.resolvers.setupMutationResolver.setup.bind(this.resolvers.setupMutationResolver),

				signUp: this.resolvers.signUpMutationResolver.signUp.bind(this.resolvers.signUpMutationResolver),
				signIn: this.resolvers.signInMutationResolver.signIn.bind(this.resolvers.signInMutationResolver),
				signOut: this.resolvers.signOutMutationResolver.signOut.bind(this.resolvers.signOutMutationResolver),
				changePassword: this.resolvers.changePasswordMutationResolver.changePassword.bind(
					this.resolvers.changePasswordMutationResolver
				),

				addProjectMember: this.resolvers.addProjectMemberMutationResolver.addProjectMember.bind(
					this.resolvers.addProjectMemberMutationResolver
				),
				updateProjectMember: this.resolvers.updateProjectMemberMutationResolver.updateProjectMember.bind(
					this.resolvers.updateProjectMemberMutationResolver
				),
				removeProjectMember: this.resolvers.removeProjectMemberMutationResolver.removeProjectMember.bind(
					this.resolvers.updateProjectMemberMutationResolver
				),

				createApiKey: this.resolvers.createApiKeyMutationResolver.createApiKey.bind(
					this.resolvers.createApiKeyMutationResolver
				),
				disableApiKey: this.resolvers.disableApiKeyMutationResolver.disableApiKey.bind(
					this.resolvers.disableApiKeyMutationResolver
				),
			},
		}
	}
}

namespace ResolverFactory {
	export type FieldResolverArgs = {
		[argument: string]: any
	}
}

export default ResolverFactory
