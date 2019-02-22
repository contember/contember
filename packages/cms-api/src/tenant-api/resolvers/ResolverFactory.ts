import { GraphQLResolveInfo } from 'graphql'
import { MutationResolvers } from '../schema/types'
import MeQueryResolver from './query/MeQueryResolver'
import SignUpMutationResolver from './mutation/SignUpMutationResolver'
import SignInMutationResolver from './mutation/SignInMutationResolver'
import AddProjectMemberMutationResolver from './mutation/AddProjectMemberMutationResolver'
import { Config } from 'apollo-server-core'
import SetupMutationResolver from './mutation/SetupMutationResolver'
import UpdateProjectMemberVariablesMutationResolver from './mutation/UpdateProjectMemberVariablesMutationResolver'
import ResolverContext from './ResolverContext'
import CreateApiKeyMutationResolver from './mutation/CreateApiKeyMutationResolver'

class ResolverFactory {
	public constructor(
		private meQueryResolver: MeQueryResolver,
		private signUpMutationResolver: SignUpMutationResolver,
		private signInMutationResolver: SignInMutationResolver,
		private addProjectMemberMutationResolver: AddProjectMemberMutationResolver,
		private setupMutationResolver: SetupMutationResolver,
		private updateProjectMemberVariablesMutationResolver: UpdateProjectMemberVariablesMutationResolver,
		private createApiKeyMutationResolver: CreateApiKeyMutationResolver
	) {}

	create(): Config['resolvers'] {
		return {
			Query: {
				me: this.meQueryResolver.me.bind(this.meQueryResolver),
			},
			Mutation: {
				signUp: (
					parent: any,
					args: ResolverFactory.FieldResolverArgs,
					context: ResolverContext,
					info: GraphQLResolveInfo
				) =>
					this.signUpMutationResolver.signUp.call(
						this.signUpMutationResolver,
						parent,
						args as MutationResolvers.SignUpArgs,
						context,
						info
					),
				signIn: (
					parent: any,
					args: ResolverFactory.FieldResolverArgs,
					context: ResolverContext,
					info: GraphQLResolveInfo
				) =>
					this.signInMutationResolver.signIn.call(
						this.signInMutationResolver,
						parent,
						args as MutationResolvers.SignInArgs,
						context,
						info
					),
				addProjectMember: (
					parent: any,
					args: ResolverFactory.FieldResolverArgs,
					context: ResolverContext,
					info: GraphQLResolveInfo
				) =>
					this.addProjectMemberMutationResolver.addProjectMember.call(
						this.addProjectMemberMutationResolver,
						parent,
						args as MutationResolvers.AddProjectMemberArgs,
						context,
						info
					),
				setup: (
					parent: any,
					args: ResolverFactory.FieldResolverArgs,
					context: ResolverContext,
					info: GraphQLResolveInfo
				) =>
					this.setupMutationResolver.setup.call(
						this.setupMutationResolver,
						parent,
						args as MutationResolvers.SetupArgs,
						context,
						info
					),
				updateProjectMemberVariables: (
					parent: any,
					args: ResolverFactory.FieldResolverArgs,
					context: ResolverContext,
					info: GraphQLResolveInfo
				) =>
					this.updateProjectMemberVariablesMutationResolver.updateProjectMemberVariables.call(
						this.updateProjectMemberVariablesMutationResolver,
						parent,
						args as MutationResolvers.UpdateProjectMemberVariablesArgs,
						context,
						info
					),
				createApiKey: (
					parent: any,
					args: ResolverFactory.FieldResolverArgs,
					context: ResolverContext,
					info: GraphQLResolveInfo
				) =>
					this.createApiKeyMutationResolver.createApiKey.call(
						this.createApiKeyMutationResolver,
						parent,
						args as MutationResolvers.CreateApiKeyArgs,
						context,
						info
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
