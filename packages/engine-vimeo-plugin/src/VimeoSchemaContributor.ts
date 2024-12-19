import {
	GraphQLBoolean,
	GraphQLError,
	GraphQLFieldConfig,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchemaConfig,
	GraphQLString,
} from 'graphql'
import { VimeoServiceFactory } from './VimeoService'
import { ProjectVimeoConfig } from './Config'
import { GraphQLSchemaContributor, GraphQLSchemaContributorContext } from '@contember/engine-plugins'

interface VimeoAcl {
	upload?: boolean
}

export class VimeoSchemaContributor implements GraphQLSchemaContributor {
	constructor(
		private readonly vimeoServiceFactory: VimeoServiceFactory,
	) {}

	getCacheKey?(context: GraphQLSchemaContributorContext): string {
		return context.project.vimeo ? 'yes' : 'no'
	}

	createSchema(context: GraphQLSchemaContributorContext): GraphQLSchemaConfig | undefined {
		if (!context.project.vimeo) {
			return undefined
		}

		if (
			!context.identity.projectRoles.find(
				role => (context.schema.acl.roles[role]?.vimeo as VimeoAcl | undefined)?.upload,
			)
		) {
			return undefined
		}

		const uploadMutation = this.createMutation()
		const mutation = {
			generateVimeoUploadUrl: uploadMutation as GraphQLFieldConfig<any, any, any>,
		}
		return {
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
		}
	}

	private createMutation(): GraphQLFieldConfig<any, any, any> {
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
			resolve: async (parent: any, args: { size: number }, ctx: { project: ProjectVimeoConfig }) => {
				if (!ctx.project.vimeo) {
					throw new GraphQLError('Vimeo is not configured for this project')
				}
				const vimeoService = this.vimeoServiceFactory.create(ctx.project.vimeo)
				return await vimeoService.getUploadUrl(args.size)
			},
		}
	}
}
