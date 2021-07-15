import {
	AddProjectMemberMutationResolver,
	ChangePasswordMutationResolver,
	CreateApiKeyMutationResolver,
	CreateProjectMutationResolver,
	DisableApiKeyMutationResolver,
	InviteMutationResolver,
	MailTemplateMutationResolver,
	OtpMutationResolver,
	RemoveProjectMemberMutationResolver,
	SignInMutationResolver,
	SignOutMutationResolver,
	SignUpMutationResolver,
	UpdateProjectMemberMutationResolver,
} from './mutation'

import { Resolvers } from '../schema'
import { MeQueryResolver, ProjectMembersQueryResolver, ProjectQueryResolver } from './query'
import { IdentityTypeResolver, ProjectTypeResolver } from './types'
import { ResetPasswordMutationResolver } from './mutation/person/ResetPasswordMutationResolver'
import { IDPMutationResolver } from './mutation/person/IDPMutationResolver'
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

			identityTypeResolver: IdentityTypeResolver
			projectTypeResolver: ProjectTypeResolver
		},
	) {}

	create(): Resolvers {
		return {
			Json: JSONType,
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
				signUp: this.resolvers.signUpMutationResolver.signUp.bind(this.resolvers.signUpMutationResolver),
				signIn: this.resolvers.signInMutationResolver.signIn.bind(this.resolvers.signInMutationResolver),
				signOut: this.resolvers.signOutMutationResolver.signOut.bind(this.resolvers.signOutMutationResolver),
				changePassword: this.resolvers.changePasswordMutationResolver.changePassword.bind(
					this.resolvers.changePasswordMutationResolver,
				),
				initSignInIDP: this.resolvers.idpMutationResolver.initSignInIDP.bind(this.resolvers.idpMutationResolver),
				signInIDP: this.resolvers.idpMutationResolver.signInIDP.bind(this.resolvers.idpMutationResolver),
				createResetPasswordRequest: this.resolvers.resetPasswordMutationResolver.createResetPasswordRequest.bind(
					this.resolvers.resetPasswordMutationResolver,
				),
				resetPassword: this.resolvers.resetPasswordMutationResolver.resetPassword.bind(
					this.resolvers.resetPasswordMutationResolver,
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
				createProject: this.resolvers.createProjectMutationResolver.createProject.bind(
					this.resolvers.createProjectMutationResolver,
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
