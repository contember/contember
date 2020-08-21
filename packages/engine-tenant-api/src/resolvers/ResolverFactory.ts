import {
	AddProjectMemberMutationResolver,
	ChangePasswordMutationResolver,
	CreateApiKeyMutationResolver,
	DisableApiKeyMutationResolver,
	RemoveProjectMemberMutationResolver,
	SetupMutationResolver,
	SignInMutationResolver,
	SignOutMutationResolver,
	SignUpMutationResolver,
	UpdateProjectMemberMutationResolver,
	InviteMutationResolver,
	OtpMutationResolver,
	MailTemplateMutationResolver,
} from './mutation'

import { Resolvers } from '../schema'
import { MeQueryResolver, ProjectQueryResolver, ProjectMembersQueryResolver } from './query'
import { IdentityTypeResolver, ProjectTypeResolver } from './types'

class ResolverFactory {
	public constructor(
		private readonly resolvers: {
			meQueryResolver: MeQueryResolver
			projectQueryResolver: ProjectQueryResolver
			projectMembersQueryResolver: ProjectMembersQueryResolver

			setupMutationResolver: SetupMutationResolver

			signUpMutationResolver: SignUpMutationResolver
			signInMutationResolver: SignInMutationResolver
			signOutMutationResolver: SignOutMutationResolver
			changePasswordMutationResolver: ChangePasswordMutationResolver

			inviteMutationResolver: InviteMutationResolver
			addProjectMemberMutationResolver: AddProjectMemberMutationResolver
			updateProjectMemberMutationResolver: UpdateProjectMemberMutationResolver
			removeProjectMemberMutationResolver: RemoveProjectMemberMutationResolver

			createApiKeyMutationResolver: CreateApiKeyMutationResolver
			disableApiKeyMutationResolver: DisableApiKeyMutationResolver

			otpMutationResolver: OtpMutationResolver

			mailTemplateMutationResolver: MailTemplateMutationResolver

			identityTypeResolver: IdentityTypeResolver
			projectTypeResolver: ProjectTypeResolver
		},
	) {}

	create(): Resolvers {
		return {
			Identity: {
				projects: this.resolvers.identityTypeResolver.projects.bind(this.resolvers.identityTypeResolver),
				person: this.resolvers.identityTypeResolver.person.bind(this.resolvers.identityTypeResolver),
			},
			Project: {
				members: this.resolvers.projectTypeResolver.members.bind(this.resolvers.projectTypeResolver),
				roles: this.resolvers.projectTypeResolver.roles.bind(this.resolvers.projectTypeResolver),
			},
			Query: {
				me: this.resolvers.meQueryResolver.me.bind(this.resolvers.meQueryResolver),
				projectBySlug: this.resolvers.projectQueryResolver.projectBySlug.bind(this.resolvers.projectQueryResolver),
				projects: this.resolvers.projectQueryResolver.projects.bind(this.resolvers.projectQueryResolver),
				projectMemberships: this.resolvers.projectMembersQueryResolver.projectMemberships.bind(
					this.resolvers.projectMembersQueryResolver,
				),
			},
			Mutation: {
				setup: this.resolvers.setupMutationResolver.setup.bind(this.resolvers.setupMutationResolver),

				signUp: this.resolvers.signUpMutationResolver.signUp.bind(this.resolvers.signUpMutationResolver),
				signIn: this.resolvers.signInMutationResolver.signIn.bind(this.resolvers.signInMutationResolver),
				signOut: this.resolvers.signOutMutationResolver.signOut.bind(this.resolvers.signOutMutationResolver),
				changePassword: this.resolvers.changePasswordMutationResolver.changePassword.bind(
					this.resolvers.changePasswordMutationResolver,
				),
				invite: this.resolvers.inviteMutationResolver.invite.bind(this.resolvers.inviteMutationResolver),
				unmanagedInvite: this.resolvers.inviteMutationResolver.unmanagedInvite.bind(
					this.resolvers.inviteMutationResolver,
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
				prepareOtp: this.resolvers.otpMutationResolver.prepareOtp.bind(this.resolvers.otpMutationResolver),
				confirmOtp: this.resolvers.otpMutationResolver.confirmOtp.bind(this.resolvers.otpMutationResolver),
				disableOtp: this.resolvers.otpMutationResolver.disableOtp.bind(this.resolvers.otpMutationResolver),
				addProjectMailTemplate: this.resolvers.mailTemplateMutationResolver.addProjectMailTemplate.bind(
					this.resolvers.mailTemplateMutationResolver,
				),
				removeProjectMailTemplate: this.resolvers.mailTemplateMutationResolver.removeProjectMailTemplate.bind(
					this.resolvers.mailTemplateMutationResolver,
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
