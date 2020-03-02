import { GraphQLFieldConfig, GraphQLSchema } from 'graphql'
import { GraphQLObjectsFactory } from '@contember/engine-common'
import { VimeoService, VimeoServiceFactory } from './VimeoService'
import { VimeoConfig } from './Config'
import { GraphQLSchemaContributor, SchemaContext } from '@contember/engine-plugins'

interface VimeoAcl {
	upload?: boolean
}

export class VimeoSchemaContributor implements GraphQLSchemaContributor {
	constructor(
		private readonly objectsFactory: GraphQLObjectsFactory,
		private readonly vimeoConfig: VimeoConfig | undefined,
		private readonly vimeoServiceFactory: VimeoServiceFactory,
	) {}

	getCacheKey(context: SchemaContext): string {
		const roles = context.identity.projectRoles
		roles.sort()
		return roles.join('||')
	}

	createSchema(context: SchemaContext): GraphQLSchema | undefined {
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
		return this.objectsFactory.createSchema({
			mutation: this.objectsFactory.createObjectType({
				name: 'Mutation',
				fields: () => mutation,
			}),
			query: this.objectsFactory.createObjectType({
				name: 'Query',
				fields: () => ({
					vimeoDummyQuery: {
						type: this.objectsFactory.string,
					},
				}),
			}),
		})
	}

	private createMutation(vimeoService: VimeoService): GraphQLFieldConfig<any, any, any> {
		return {
			type: this.objectsFactory.createNotNull(
				this.objectsFactory.createObjectType({
					name: 'VimeoUploadResponse',
					fields: {
						ok: { type: this.objectsFactory.createNotNull(this.objectsFactory.boolean) },
						errors: {
							type: this.objectsFactory.createNotNull(
								this.objectsFactory.createList(
									this.objectsFactory.createNotNull(
										this.objectsFactory.createObjectType({
											name: 'VimeoUploadError',
											fields: {
												endUserMessage: { type: this.objectsFactory.string },
												developerMessage: { type: this.objectsFactory.string },
												code: { type: this.objectsFactory.int },
											},
										}),
									),
								),
							),
						},
						result: {
							type: this.objectsFactory.createObjectType({
								name: 'VimeoUploadResult',
								fields: {
									uploadUrl: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
									vimeoId: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
								},
							}),
						},
					},
				}),
			),
			args: {
				size: {
					type: this.objectsFactory.createNotNull(this.objectsFactory.int),
				},
			},
			resolve: async (parent: any, args: { size: number }) => {
				return await vimeoService.getUploadUrl(args.size)
			},
		}
	}
}
