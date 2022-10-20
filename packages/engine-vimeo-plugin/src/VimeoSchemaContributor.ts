import {
	GraphQLBoolean,
	GraphQLFieldConfig,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} from 'graphql'
import { VimeoService, VimeoServiceFactory } from './VimeoService'
import { VimeoConfig } from './Config'
import { GraphQLSchemaContributor, GraphQLSchemaContributorContext } from '@contember/engine-plugins'

interface VimeoAcl {
	upload?: boolean
}

export class VimeoSchemaContributor implements GraphQLSchemaContributor {
	constructor(
		private readonly vimeoConfig: VimeoConfig | undefined,
		private readonly vimeoServiceFactory: VimeoServiceFactory,
	) {}

	getCacheKey(context: GraphQLSchemaContributorContext): string {
		const roles = context.identity.projectRoles
		roles.sort()
		return roles.join('||')
	}

	createSchema(context: GraphQLSchemaContributorContext): GraphQLSchema | undefined {
		if (!this.vimeoConfig) {
			return undefined
		}

		if (
			!context.identity.projectRoles.find(
				role => (context.schema.acl.roles[role]?.vimeo as VimeoAcl | undefined)?.upload,
			)
		) {
			return undefined
		}

		const vimeoService = this.vimeoServiceFactory.create(this.vimeoConfig)

		const uploadMutation = this.createMutation(vimeoService)
		const mutation = {
			generateVimeoUploadUrl: uploadMutation as GraphQLFieldConfig<any, any, any>,
		}
		return new GraphQLSchema({
			mutation: new GraphQLObjectType({
				name: 'Mutation',
				fields: () => mutation,
			}),
			query: new GraphQLObjectType({
				name: 'Query',
				fields: () => ({
					vimeoDummyQuery: {
						type: GraphQLString,
					},
				}),
			}),
		})
	}

	private createMutation(vimeoService: VimeoService): GraphQLFieldConfig<any, any, any> {
		return {
			type: new GraphQLNonNull(
				new GraphQLObjectType({
					name: 'VimeoUploadResponse',
					fields: {
						ok: { type: new GraphQLNonNull(GraphQLBoolean) },
						errors: {
							type: new GraphQLNonNull(
								new GraphQLList(
									new GraphQLNonNull(
										new GraphQLObjectType({
											name: 'VimeoUploadError',
											fields: {
												endUserMessage: { type: GraphQLString },
												developerMessage: { type: GraphQLString },
												code: { type: GraphQLInt },
											},
										}),
									),
								),
							),
						},
						result: {
							type: new GraphQLObjectType({
								name: 'VimeoUploadResult',
								fields: {
									uploadUrl: { type: new GraphQLNonNull(GraphQLString) },
									vimeoId: { type: new GraphQLNonNull(GraphQLString) },
								},
							}),
						},
					},
				}),
			),
			args: {
				size: {
					type: new GraphQLNonNull(GraphQLInt),
				},
			},
			resolve: async (parent: any, args: { size: number }) => {
				return await vimeoService.getUploadUrl(args.size)
			},
		}
	}
}
