import { Config } from 'apollo-server-core'

import MeQueryResolver from './query/MeQueryResolver'

import SignUpMutationResolver from './mutation/person/SignUpMutationResolver'
import SignInMutationResolver from './mutation/person/SignInMutationResolver'
import AddProjectMemberMutationResolver from './mutation/projectMember/AddProjectMemberMutationResolver'
import UpdateProjectMemberVariablesMutationResolver from './mutation/projectMember/UpdateProjectMemberVariablesMutationResolver'
import SetupMutationResolver from './mutation/setup/SetupMutationResolver'
import CreateApiKeyMutationResolver from './mutation/apiKey/CreateApiKeyMutationResolver'
import ChangePasswordMutationResolver from './mutation/person/ChangePasswordMutationResolver'
import SignOutMutationResolver from './mutation/person/SignOutMutationResolver'

class ResolverFactory {
	public constructor(private readonly resolvers: {
		                   meQueryResolver: MeQueryResolver,
		                   signUpMutationResolver: SignUpMutationResolver,
		                   signInMutationResolver: SignInMutationResolver,
		                   signOutMutationResolver: SignOutMutationResolver,
		                   changePasswordMutationResolver: ChangePasswordMutationResolver,
		                   addProjectMemberMutationResolver: AddProjectMemberMutationResolver,
		                   setupMutationResolver: SetupMutationResolver,
		                   updateProjectMemberVariablesMutationResolver: UpdateProjectMemberVariablesMutationResolver,
		                   createApiKeyMutationResolver: CreateApiKeyMutationResolver
	                   }
	) {
	}

	create(): Config['resolvers'] {
		return {
			Query: {
				me: this.resolvers.meQueryResolver.me.bind(this.resolvers.meQueryResolver),
			},
			Mutation: {
				signUp: this.resolvers.signUpMutationResolver.signUp.bind(this.resolvers.signUpMutationResolver),
				signIn: this.resolvers.signInMutationResolver.signIn.bind(this.resolvers.signInMutationResolver),
				signOut: this.resolvers.signOutMutationResolver.signOut.bind(this.resolvers.signOutMutationResolver),
				changePassword: this.resolvers.changePasswordMutationResolver.changePassword.bind(this.resolvers.changePasswordMutationResolver),
				addProjectMember: this.resolvers.addProjectMemberMutationResolver.addProjectMember.bind(
					this.resolvers.addProjectMemberMutationResolver
				),
				setup: this.resolvers.setupMutationResolver.setup.bind(this.resolvers.setupMutationResolver),
				updateProjectMemberVariables: this.resolvers.updateProjectMemberVariablesMutationResolver.updateProjectMemberVariables.bind(
					this.resolvers.updateProjectMemberVariablesMutationResolver
				),
				createApiKey: this.resolvers.createApiKeyMutationResolver.createApiKey.bind(
					this.resolvers.createApiKeyMutationResolver),
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
