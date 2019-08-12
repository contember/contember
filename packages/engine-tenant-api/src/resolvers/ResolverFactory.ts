import {
	IdentityTypeResolver,
	AddProjectMemberMutationResolver,
	ChangePasswordMutationResolver,
	CreateApiKeyMutationResolver,
	DisableApiKeyMutationResolver,
	MeQueryResolver,
	RemoveProjectMemberMutationResolver,
	SetupMutationResolver,
	SignInMutationResolver,
	SignOutMutationResolver,
	SignUpMutationResolver,
	UpdateProjectMemberMutationResolver,
} from './'

import { Resolvers } from '../schema'

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

			identityTypeResolver: IdentityTypeResolver
		},
	) {}

	create(): Resolvers {
		return {
			IdentityWithoutPerson: {
				projects: this.resolvers.identityTypeResolver.projects.bind(this.resolvers.identityTypeResolver),
			},
			Identity: {
				projects: this.resolvers.identityTypeResolver.projects.bind(this.resolvers.identityTypeResolver),
				person: this.resolvers.identityTypeResolver.person.bind(this.resolvers.identityTypeResolver),
			},
			Query: {
				me: this.resolvers.meQueryResolver.me.bind(this.resolvers.meQueryResolver),
			},
			Mutation: {
				setup: this.resolvers.setupMutationResolver.setup.bind(this.resolvers.setupMutationResolver),

				signUp: this.resolvers.signUpMutationResolver.signUp.bind(this.resolvers.signUpMutationResolver),
				signIn: this.resolvers.signInMutationResolver.signIn.bind(this.resolvers.signInMutationResolver),
				signOut: this.resolvers.signOutMutationResolver.signOut.bind(this.resolvers.signOutMutationResolver),
				changePassword: this.resolvers.changePasswordMutationResolver.changePassword.bind(
					this.resolvers.changePasswordMutationResolver,
				),

				addProjectMember: this.resolvers.addProjectMemberMutationResolver.addProjectMember.bind(
					this.resolvers.addProjectMemberMutationResolver,
				),
				updateProjectMember: this.resolvers.updateProjectMemberMutationResolver.updateProjectMember.bind(
					this.resolvers.updateProjectMemberMutationResolver,
				),
				removeProjectMember: this.resolvers.removeProjectMemberMutationResolver.removeProjectMember.bind(
					this.resolvers.updateProjectMemberMutationResolver,
				),

				createApiKey: this.resolvers.createApiKeyMutationResolver.createApiKey.bind(
					this.resolvers.createApiKeyMutationResolver,
				),
				disableApiKey: this.resolvers.disableApiKeyMutationResolver.disableApiKey.bind(
					this.resolvers.disableApiKeyMutationResolver,
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

export { ResolverFactory }
