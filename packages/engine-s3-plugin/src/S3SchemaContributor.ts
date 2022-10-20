import {
	GraphQLEnumType,
	GraphQLFieldConfig,
	GraphQLInt,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
} from 'graphql'
import { S3Acl, S3Service, S3ServiceFactory } from './S3Service'
import { resolveS3Config, S3Config } from './Config'
import { createObjectKeyVerifier, ObjectKeyVerifier } from './ObjectKeyVerifier'
import { GraphQLSchemaContributor, GraphQLSchemaContributorContext, Providers } from '@contember/engine-plugins'

interface Identity {
	projectRoles: string[]
}

type S3SchemaAcl = Record<
	string, // public/*.jpg
	{
		read?: boolean
		upload?: boolean
	}
>

export class S3SchemaContributor implements GraphQLSchemaContributor {
	private s3HeadersType: GraphQLFieldConfig<any, any> = {
		type: new GraphQLNonNull(
			new GraphQLList(
				new GraphQLNonNull(
					new GraphQLObjectType({
						name: 'S3Header',
						fields: {
							key: { type: new GraphQLNonNull(GraphQLString) },
							value: { type: new GraphQLNonNull(GraphQLString) },
						},
					}),
				),
			),
		),
	}

	constructor(
		private readonly s3Config: S3Config | undefined,
		private readonly s3Factory: S3ServiceFactory,
		private readonly providers: Providers,
	) {}

	getCacheKey(context: GraphQLSchemaContributorContext): string {
		const roles = context.identity.projectRoles
		roles.sort()
		return roles.join('||')
	}

	createSchema(context: GraphQLSchemaContributorContext): GraphQLSchema | undefined {
		if (!this.s3Config) {
			return undefined
		}
		const rules = context.identity.projectRoles.flatMap(it =>
			Object.entries((context.schema.acl.roles[it]?.s3 as S3SchemaAcl) || {}),
		)

		const allowedUploads = rules.filter(([, it]) => it.upload).map(([it]) => it)
		const allowedReads = rules.filter(([, it]) => it.read).map(([it]) => it)

		if (allowedUploads.length === 0 && allowedReads.length == 0) {
			return undefined
		}

		const s3Config = resolveS3Config(this.s3Config)
		const s3 = this.s3Factory.create(s3Config, this.providers)
		const uploadMutation = this.createUploadMutation(s3Config, s3, allowedUploads)
		const readMutation = this.createReadMutation(s3, allowedReads)
		const mutation = {
			generateUploadUrl: uploadMutation as GraphQLFieldConfig<any, any, any>,
			generateReadUrl: readMutation,
		}
		return new GraphQLSchema({
			mutation: new GraphQLObjectType({
				name: 'Mutation',
				fields: () => mutation,
			}),
			query: new GraphQLObjectType({
				name: 'Query',
				fields: () => ({
					s3DummyQuery: {
						type: GraphQLString,
					},
				}),
			}),
		})
	}

	private createReadMutation(s3: S3Service, allowedKeyPatterns: string[]): GraphQLFieldConfig<any, any, any> {
		let verifier: ObjectKeyVerifier
		return {
			type: new GraphQLNonNull(
				new GraphQLObjectType({
					name: 'S3SignedRead',
					fields: {
						url: { type: new GraphQLNonNull(GraphQLString) },
						headers: this.s3HeadersType,
						method: { type: new GraphQLNonNull(GraphQLString) },
						objectKey: {
							type: new GraphQLNonNull(GraphQLString),
							description: `Allowed patterns:\n${allowedKeyPatterns.join('\n')}`,
						},
						bucket: { type: new GraphQLNonNull(GraphQLString) },
					},
				}),
			),
			args: {
				objectKey: {
					type: new GraphQLNonNull(GraphQLString),
				},
				expiration: {
					type: GraphQLInt,
				},
			},
			resolve: async (parent: any, args: { objectKey: string; expiration?: number }) => {
				if (!verifier) {
					verifier = createObjectKeyVerifier(allowedKeyPatterns)
				}
				return s3.getSignedReadUrl(args.objectKey, verifier, args.expiration)
			},
		} as GraphQLFieldConfig<any, any, any>
	}

	private createUploadMutation(
		s3Config: S3Config,
		s3: S3Service,
		allowedKeyPatterns: string[],
	): GraphQLFieldConfig<any, any, any> {
		let verifier: ObjectKeyVerifier
		return {
			type: new GraphQLNonNull(
				new GraphQLObjectType({
					name: 'S3SignedUpload',
					fields: {
						url: { type: new GraphQLNonNull(GraphQLString) },
						headers: this.s3HeadersType,
						method: { type: new GraphQLNonNull(GraphQLString) },
						objectKey: {
							type: new GraphQLNonNull(GraphQLString),
							description: `Allowed patterns:\n${allowedKeyPatterns.join('\n')}`,
						},
						bucket: { type: new GraphQLNonNull(GraphQLString) },
						publicUrl: { type: new GraphQLNonNull(GraphQLString) },
					},
				}),
			),
			args: {
				contentType: {
					type: new GraphQLNonNull(GraphQLString),
				},
				expiration: {
					type: GraphQLInt,
				},
				prefix: {
					type: GraphQLString,
				},
				...(s3Config.noAcl
					? {}
					: {
						acl: {
							type: new GraphQLEnumType({
								name: 'S3Acl',
								values: {
									PUBLIC_READ: {},
									PRIVATE: {},
									NONE: {},
								},
							}),
						},
					  }),
			},
			resolve: async (
				parent: any,
				args: { contentType: string; acl?: string; expiration?: number; prefix?: string },
			) => {
				if (!verifier) {
					verifier = createObjectKeyVerifier(allowedKeyPatterns)
				}
				const aclMapping: Record<string, S3Acl> = {
					PUBLIC_READ: S3Acl.PublicRead,
					PRIVATE: S3Acl.Private,
					NONE: S3Acl.None,
				}
				const acl: S3Acl | undefined = args.acl ? aclMapping[args.acl] || undefined : undefined
				return s3.getSignedUploadUrl(args.contentType, verifier, acl, args.expiration, args.prefix)
			},
		}
	}
}
