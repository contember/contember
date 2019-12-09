import { GraphQLFieldConfig, GraphQLSchema } from 'graphql'
import { GraphQLObjectsFactory } from '@contember/engine-common'
import { S3Acl, S3ServiceFactory } from './S3Service'
import { resolveS3Config, S3Config } from './Config'

export class S3SchemaFactory {
	constructor(
		private readonly objectsFactory: GraphQLObjectsFactory,
		private readonly s3Config: S3Config | undefined,
		private readonly s3Factory: S3ServiceFactory,
	) {}

	public create(): undefined | GraphQLSchema {
		if (!this.s3Config) {
			return undefined
		}
		const s3Config = resolveS3Config(this.s3Config)
		const s3 = this.s3Factory.create(s3Config)
		const headers = {
			type: this.objectsFactory.createNotNull(
				this.objectsFactory.createList(
					this.objectsFactory.createNotNull(
						this.objectsFactory.createObjectType({
							name: 'S3Header',
							fields: {
								key: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
								value: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							},
						}),
					),
				),
			),
		}
		const mutation = {
			generateUploadUrl: {
				type: this.objectsFactory.createNotNull(
					this.objectsFactory.createObjectType({
						name: 'S3SignedUpload',
						fields: {
							url: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							headers: headers,
							method: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							objectKey: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							bucket: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							publicUrl: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
						},
					}),
				),
				args: {
					contentType: {
						type: this.objectsFactory.createNotNull(this.objectsFactory.string),
					},
					expiration: {
						type: this.objectsFactory.int,
					},
					prefix: {
						type: this.objectsFactory.string,
					},
					...(s3Config.noAcl
						? {}
						: {
								acl: {
									type: this.objectsFactory.createEnumType({
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
					const aclMapping: Record<string, S3Acl> = {
						PUBLIC_READ: S3Acl.PublicRead,
						PRIVATE: S3Acl.Private,
						NONE: S3Acl.None,
					}
					const acl: S3Acl | undefined = args.acl ? aclMapping[args.acl] || undefined : undefined
					return s3.getSignedUploadUrl(args.contentType, acl, args.expiration, args.prefix)
				},
			} as GraphQLFieldConfig<any, any, any>,
			generateReadUrl: {
				type: this.objectsFactory.createNotNull(
					this.objectsFactory.createObjectType({
						name: 'S3SignedRead',
						fields: {
							url: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							headers: headers,
							method: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							objectKey: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							bucket: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
						},
					}),
				),
				args: {
					objectKey: {
						type: this.objectsFactory.createNotNull(this.objectsFactory.string),
					},
					expiration: {
						type: this.objectsFactory.int,
					},
				},
				resolve: async (parent: any, args: { objectKey: string; expiration?: number }) => {
					return s3.getSignedReadUrl(args.objectKey, args.expiration)
				},
			} as GraphQLFieldConfig<any, any, any>,
		}
		return this.objectsFactory.createSchema({
			mutation: this.objectsFactory.createObjectType({
				name: 'Mutation',
				fields: () => mutation,
			}),
			query: this.objectsFactory.createObjectType({
				name: 'Query',
				fields: () => ({
					s3DummyQuery: {
						type: this.objectsFactory.string,
					},
				}),
			}),
		})
	}
}
