import { GraphQLFieldConfig, GraphQLSchema } from 'graphql'
import { GraphQLObjectsFactory } from '@contember/engine-common'
import { S3Service } from './S3Service'

export class S3SchemaFactory {
	constructor(private readonly objectsFactory: GraphQLObjectsFactory, private readonly s3: S3Service) {}

	public create(): GraphQLSchema {
		const mutation = {
			generateUploadUrl: {
				type: this.objectsFactory.createNotNull(
					this.objectsFactory.createObjectType({
						name: 'SignedUpload',
						fields: {
							url: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							objectKey: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							bucket: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							region: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
							publicUrl: { type: this.objectsFactory.createNotNull(this.objectsFactory.string) },
						},
					}),
				),
				args: {
					contentType: {
						type: this.objectsFactory.createNotNull(this.objectsFactory.string),
					},
				},
				resolve: async (parent: any, args: { contentType: string }) => {
					return this.s3.getSignedUrl(args.contentType)
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
