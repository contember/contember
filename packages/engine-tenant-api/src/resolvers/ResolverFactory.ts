import {
	AddIDPMutationResolver,
	AddProjectMemberMutationResolver,
	ChangePasswordMutationResolver,
	ChangeProfileMutationResolver,
	CreateApiKeyMutationResolver,
	CreateProjectMutationResolver,
	DisableApiKeyMutationResolver,
	DisableIDPMutationResolver,
	EnableIDPMutationResolver,
	IdentityGlobalRolesMutationResolver,
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
import { MeQueryResolver, PersonQueryResolver, ProjectMembersQueryResolver, ProjectQueryResolver } from './query'
import { IdentityTypeResolver, ProjectTypeResolver } from './types'
import { DateTimeType, IntervalType, JSONType } from '@contember/graphql-utils'
import { IDPQueryResolver } from './query/IDPQueryResolver'
import { UpdateIDPMutationResolver } from './mutation/idp/UpdateIDPMutationResolver'
import { DisablePersonMutationResolver } from './mutation/person/DisablePersonMutationResolver'
import { MailTemplateQueryResolver } from './query/MailTemplateQueryResolver'
import { ConfigurationMutationResolver } from './mutation/configuration/ConfigurationMutationResolver'
import { ConfigurationQueryResolver } from './query/ConfigurationQueryResolver'
import { PasswordlessMutationResolver } from './mutation/person/PasswordlessMutationResolver'
import { TogglePasswordlessMutationResolver } from './mutation/person/TogglePasswordlessMutationResolver'

class ResolverFactory {
	public constructor(
		private readonly resolvers: {
			meQueryResolver: MeQueryResolver
			personQueryResolver: PersonQueryResolver
			projectQueryResolver: ProjectQueryResolver
			projectMembersQueryResolver: ProjectMembersQueryResolver
			idpQueryResolver: IDPQueryResolver
			mailTemplateQueryResolver: MailTemplateQueryResolver

			signUpMutationResolver: SignUpMutationResolver
			signInMutationResolver: SignInMutationResolver
			signOutMutationResolver: SignOutMutationResolver
			changeProfileMutationResolver: ChangeProfileMutationResolver
			changePasswordMutationResolver: ChangePasswordMutationResolver
			resetPasswordMutationResolver: ResetPasswordMutationResolver
			idpMutationResolver: IDPMutationResolver
			registerIdpMutationResolver: AddIDPMutationResolver
			disableIdpMutationResolver: DisableIDPMutationResolver
			enableIdpMutationResolver: EnableIDPMutationResolver
			updateIdpMutationResolver: UpdateIDPMutationResolver
			passwordlessMutationResolver: PasswordlessMutationResolver

			disablePersonMutationResolver: DisablePersonMutationResolver

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

			identityGlobalRolesMutationResolver: IdentityGlobalRolesMutationResolver

			configurationMutationResolver: ConfigurationMutationResolver
			configurationQueryResolver: ConfigurationQueryResolver

			togglePasswordlessMutationResolver: TogglePasswordlessMutationResolver

		},
	) { }

	create(): Resolvers & { Mutation: Required<Resolvers['Mutation']> } & { Query: Required<Resolvers['Query']> } {
		return {
			Json: JSONType,
			DateTime: DateTimeType,
			Interval: IntervalType,
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
				personById: this.resolvers.personQueryResolver.personById.bind(this.resolvers.personQueryResolver),
				projectBySlug: this.resolvers.projectQueryResolver.projectBySlug.bind(this.resolvers.projectQueryResolver),
				projects: this.resolvers.projectQueryResolver.projects.bind(this.resolvers.projectQueryResolver),
				projectMemberships: this.resolvers.projectMembersQueryResolver.projectMemberships.bind(this.resolvers.projectMembersQueryResolver),
				identityProviders: this.resolvers.idpQueryResolver.identityProviders.bind(this.resolvers.idpQueryResolver),
				mailTemplates: this.resolvers.mailTemplateQueryResolver.mailTemplates.bind(this.resolvers.mailTemplateQueryResolver),
				configuration: this.resolvers.configurationQueryResolver.configuration.bind(this.resolvers.configurationQueryResolver),
				checkResetPasswordToken: () => {
					throw new Error('not implemented')
				},
			},
			Mutation: {
				signUp: this.resolvers.signUpMutationResolver.signUp.bind(this.resolvers.signUpMutationResolver),
				signIn: this.resolvers.signInMutationResolver.signIn.bind(this.resolvers.signInMutationResolver),
				createSessionToken: this.resolvers.signInMutationResolver.createSessionToken.bind(this.resolvers.signInMutationResolver),
				signOut: this.resolvers.signOutMutationResolver.signOut.bind(this.resolvers.signOutMutationResolver),

				changeProfile: this.resolvers.changeProfileMutationResolver.changeProfile.bind(this.resolvers.changeProfileMutationResolver),
				changeMyProfile: this.resolvers.changeProfileMutationResolver.changeMyProfile.bind(this.resolvers.changeProfileMutationResolver),
				changePassword: this.resolvers.changePasswordMutationResolver.changePassword.bind(this.resolvers.changePasswordMutationResolver),
				changeMyPassword: this.resolvers.changePasswordMutationResolver.changeMyPassword.bind(this.resolvers.changePasswordMutationResolver),
				createResetPasswordRequest: this.resolvers.resetPasswordMutationResolver.createResetPasswordRequest.bind(this.resolvers.resetPasswordMutationResolver),
				resetPassword: this.resolvers.resetPasswordMutationResolver.resetPassword.bind(this.resolvers.resetPasswordMutationResolver),

				initSignInIDP: this.resolvers.idpMutationResolver.initSignInIDP.bind(this.resolvers.idpMutationResolver),
				signInIDP: this.resolvers.idpMutationResolver.signInIDP.bind(this.resolvers.idpMutationResolver),
				addIDP: this.resolvers.registerIdpMutationResolver.addIDP.bind(this.resolvers.registerIdpMutationResolver),
				disableIDP: this.resolvers.disableIdpMutationResolver.disableIDP.bind(this.resolvers.disableIdpMutationResolver),
				enableIDP: this.resolvers.enableIdpMutationResolver.enableIDP.bind(this.resolvers.enableIdpMutationResolver),
				updateIDP: this.resolvers.updateIdpMutationResolver.updateIDP.bind(this.resolvers.updateIdpMutationResolver),
				disablePerson: this.resolvers.disablePersonMutationResolver.disablePerson.bind(this.resolvers.disablePersonMutationResolver),

				signInPasswordless: this.resolvers.passwordlessMutationResolver.signInPasswordless.bind(this.resolvers.passwordlessMutationResolver),
				initSignInPasswordless: this.resolvers.passwordlessMutationResolver.initSignInPasswordless.bind(this.resolvers.passwordlessMutationResolver),
				activatePasswordlessOtp: this.resolvers.passwordlessMutationResolver.activatePasswordlessOtp.bind(this.resolvers.passwordlessMutationResolver),
				disableMyPasswordless: this.resolvers.togglePasswordlessMutationResolver.disableMyPasswordless.bind(this.resolvers.togglePasswordlessMutationResolver),
				enableMyPasswordless: this.resolvers.togglePasswordlessMutationResolver.enableMyPasswordless.bind(this.resolvers.togglePasswordlessMutationResolver),

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

				addGlobalIdentityRoles: this.resolvers.identityGlobalRolesMutationResolver.addGlobalIdentityRoles.bind(this.resolvers.identityGlobalRolesMutationResolver),
				removeGlobalIdentityRoles: this.resolvers.identityGlobalRolesMutationResolver.removeGlobalIdentityRoles.bind(this.resolvers.identityGlobalRolesMutationResolver),

				configure: this.resolvers.configurationMutationResolver.configure.bind(this.resolvers.configurationMutationResolver),
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
