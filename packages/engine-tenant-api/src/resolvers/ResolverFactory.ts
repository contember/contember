import {
	AddProjectMemberMutationResolver,
	ChangePasswordMutationResolver,
	CreateApiKeyMutationResolver,
	CreateProjectMutationResolver,
	DisableApiKeyMutationResolver,
	IDPMutationResolver,
	InviteMutationResolver,
	MailTemplateMutationResolver,
	OtpMutationResolver,
	RemoveProjectMemberMutationResolver,
	ResetPasswordMutationResolver,
	SetProjectSecretMutationResolver,
	SignInMutationResolver,
	SignOutMutationResolver,
	SignUpMutationResolver,
	UpdateProjectMemberMutationResolver,
	UpdateProjectMutationResolver,
} from './mutation'

import { Resolvers } from '../schema'
import { MeQueryResolver, ProjectMembersQueryResolver, ProjectQueryResolver } from './query'
import { IdentityTypeResolver, ProjectTypeResolver } from './types'
import { JSONType } from '@contember/graphql-utils'

class ResolverFactory {
	public constructor(
		private readonly resolvers: {
			meQueryResolver: MeQueryResolver
			projectQueryResolver: ProjectQueryResolver
			projectMembersQueryResolver: ProjectMembersQueryResolver

			signUpMutationResolver: SignUpMutationResolver
			signInMutationResolver: SignInMutationResolver
			signOutMutationResolver: SignOutMutationResolver
			changePasswordMutationResolver: ChangePasswordMutationResolver
			resetPasswordMutationResolver: ResetPasswordMutationResolver
			idpMutationResolver: IDPMutationResolver

			inviteMutationResolver: InviteMutationResolver
			addProjectMemberMutationResolver: AddProjectMemberMutationResolver
			updateProjectMemberMutationResolver: UpdateProjectMemberMutationResolver
			removeProjectMemberMutationResolver: RemoveProjectMemberMutationResolver

			createApiKeyMutationResolver: CreateApiKeyMutationResolver
			disableApiKeyMutationResolver: DisableApiKeyMutationResolver

			otpMutationResolver: OtpMutationResolver

			mailTemplateMutationResolver: MailTemplateMutationResolver

			createProjectMutationResolver: CreateProjectMutationResolver
			setProjectSecretMutationResolver: SetProjectSecretMutationResolver
			updateProjectMutationResolver: UpdateProjectMutationResolver

			identityTypeResolver: IdentityTypeResolver
			projectTypeResolver: ProjectTypeResolver
		},
	) {}

	create(): Resolvers & { Mutation: Required<Resolvers['Mutation']> } {
		return {
			Json: JSONType,
			Identity: {
				projects: this.resolvers.identityTypeResolver.projects.bind(this.resolvers.identityTypeResolver),
				person: this.resolvers.identityTypeResolver.person.bind(this.resolvers.identityTypeResolver),
				roles: this.resolvers.identityTypeResolver.roles.bind(this.resolvers.identityTypeResolver),
				permissions: this.resolvers.identityTypeResolver.permissions.bind(this.resolvers.identityTypeResolver),
			},
			Project: {
				members: this.resolvers.projectTypeResolver.members.bind(this.resolvers.projectTypeResolver),
				roles: this.resolvers.projectTypeResolver.roles.bind(this.resolvers.projectTypeResolver),
			},
			Query: {
				me: this.resolvers.meQueryResolver.me.bind(this.resolvers.meQueryResolver),
				projectBySlug: this.resolvers.projectQueryResolver.projectBySlug.bind(this.resolvers.projectQueryResolver),
				projects: this.resolvers.projectQueryResolver.projects.bind(this.resolvers.projectQueryResolver),
				projectMemberships: this.resolvers.projectMembersQueryResolver.projectMemberships.bind(this.resolvers.projectMembersQueryResolver),
			},
			Mutation: {
				signUp: this.resolvers.signUpMutationResolver.signUp.bind(this.resolvers.signUpMutationResolver),
				signIn: this.resolvers.signInMutationResolver.signIn.bind(this.resolvers.signInMutationResolver),
				signOut: this.resolvers.signOutMutationResolver.signOut.bind(this.resolvers.signOutMutationResolver),

				changePassword: this.resolvers.changePasswordMutationResolver.changePassword.bind(this.resolvers.changePasswordMutationResolver),
				changeMyPassword: this.resolvers.changePasswordMutationResolver.changeMyPassword.bind(this.resolvers.changePasswordMutationResolver),
				createResetPasswordRequest: this.resolvers.resetPasswordMutationResolver.createResetPasswordRequest.bind(this.resolvers.resetPasswordMutationResolver),
				resetPassword: this.resolvers.resetPasswordMutationResolver.resetPassword.bind(this.resolvers.resetPasswordMutationResolver),

				initSignInIDP: this.resolvers.idpMutationResolver.initSignInIDP.bind(this.resolvers.idpMutationResolver),
				signInIDP: this.resolvers.idpMutationResolver.signInIDP.bind(this.resolvers.idpMutationResolver),

				invite: this.resolvers.inviteMutationResolver.invite.bind(this.resolvers.inviteMutationResolver),
				unmanagedInvite: this.resolvers.inviteMutationResolver.unmanagedInvite.bind(this.resolvers.inviteMutationResolver),

				addProjectMember: this.resolvers.addProjectMemberMutationResolver.addProjectMember.bind(this.resolvers.addProjectMemberMutationResolver),
				updateProjectMember: this.resolvers.updateProjectMemberMutationResolver.updateProjectMember.bind(this.resolvers.updateProjectMemberMutationResolver),
				removeProjectMember: this.resolvers.removeProjectMemberMutationResolver.removeProjectMember.bind(this.resolvers.updateProjectMemberMutationResolver),

				createApiKey: this.resolvers.createApiKeyMutationResolver.createApiKey.bind(this.resolvers.createApiKeyMutationResolver),
				createGlobalApiKey: this.resolvers.createApiKeyMutationResolver.createGlobalApiKey.bind(this.resolvers.createApiKeyMutationResolver),
				disableApiKey: this.resolvers.disableApiKeyMutationResolver.disableApiKey.bind(this.resolvers.disableApiKeyMutationResolver),

				prepareOtp: this.resolvers.otpMutationResolver.prepareOtp.bind(this.resolvers.otpMutationResolver),
				confirmOtp: this.resolvers.otpMutationResolver.confirmOtp.bind(this.resolvers.otpMutationResolver),
				disableOtp: this.resolvers.otpMutationResolver.disableOtp.bind(this.resolvers.otpMutationResolver),

				addMailTemplate: this.resolvers.mailTemplateMutationResolver.addMailTemplate.bind(this.resolvers.mailTemplateMutationResolver),
				removeMailTemplate: this.resolvers.mailTemplateMutationResolver.removeMailTemplate.bind(this.resolvers.mailTemplateMutationResolver),

				addProjectMailTemplate: this.resolvers.mailTemplateMutationResolver.addMailTemplate.bind(this.resolvers.mailTemplateMutationResolver),
				removeProjectMailTemplate: this.resolvers.mailTemplateMutationResolver.removeMailTemplate.bind(this.resolvers.mailTemplateMutationResolver),

				createProject: this.resolvers.createProjectMutationResolver.createProject.bind(this.resolvers.createProjectMutationResolver),
				updateProject: this.resolvers.updateProjectMutationResolver.updateProject.bind(this.resolvers.updateProjectMutationResolver),
				setProjectSecret: this.resolvers.setProjectSecretMutationResolver.setProjectSecret.bind(this.resolvers.setProjectSecretMutationResolver),
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
