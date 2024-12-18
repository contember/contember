import {
	GraphQLError,
	GraphQLFieldConfig,
	GraphQLInt,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLSchemaConfig,
	GraphQLString,
} from 'graphql'
import { S3Service, S3ServiceFactory } from './S3Service'
import { Project3Config, resolveS3Config, S3Config } from './Config'
import { GraphQLSchemaContributor, GraphQLSchemaContributorContext, Providers } from '@contember/engine-plugins'
import * as types from './S3SchemaTypes'
import { S3Acl, S3GenerateSignedUploadInput, S3SignedRead, S3SignedUpload } from './S3SchemaTypes'
import { S3ObjectAuthorizator } from './S3ObjectAuthorizator'

interface Identity {
	projectRoles: string[]
}

export type S3SchemaUploadAcl =
	| boolean
	| {
		maxSize?: number
	}

export type S3SchemaAcl = Record<
	string, // public/*.jpg
	{
		read?: boolean
		upload?: S3SchemaUploadAcl
	}
>


export class S3SchemaContributor implements GraphQLSchemaContributor {
	constructor(
		private readonly s3Factory: S3ServiceFactory,
		private readonly providers: Providers,
	) {}

	getCacheKey?({ project }: GraphQLSchemaContributorContext): string {
		return project.s3 ? 'yes' : 'no'
	}

	createSchema(context: GraphQLSchemaContributorContext): GraphQLSchemaConfig | undefined {
		if (!context.project.s3) {
			return undefined
		}
		const rules = context.identity.projectRoles.flatMap(it =>
			Object.entries((context.schema.acl.roles[it]?.s3 as S3SchemaAcl) || {}),
		)


		const uploadRules = rules.filter(([, it]) => it.upload).map(([it, val]) => ({
			pattern: it,
			...(typeof val.upload !== 'boolean' ? val.upload : {}),
		}))
		const readRules = rules.filter(([, it]) => it.read).map(([it]) => ({
			pattern: it,
		}))

		if (uploadRules.length === 0 && readRules.length == 0) {
			return undefined
		}

		const authorizator = new S3ObjectAuthorizator(uploadRules, readRules)
		const uploadMutation = this.createUploadMutation(authorizator)
		const readMutation = this.createReadMutation(authorizator)
		const mutation = {
			generateUploadUrl: uploadMutation as GraphQLFieldConfig<any, any, any>,
			generateReadUrl: readMutation,
		}
		return {
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
		}
	}

	private createReadMutation(authorizator: S3ObjectAuthorizator): GraphQLFieldConfig<any, { project: Project3Config }, any> {

		return {
			type: new GraphQLNonNull(S3SignedRead),
			args: {
				objectKey: {
					type: new GraphQLNonNull(GraphQLString),
				},
				expiration: {
					type: GraphQLInt,
				},
			},
			resolve: async (parent: any, args: { objectKey: string; expiration?: number }, ctx: { project: Project3Config }) => {
				if (!ctx.project.s3) {
					throw new GraphQLError('S3 is not configured for this project')
				}
				const s3Config = resolveS3Config(ctx.project.s3)
				const s3 = this.s3Factory.create(s3Config, this.providers, authorizator)
				return s3.getSignedReadUrl({ objectKey: args.objectKey, expiration: args.expiration ?? null })
			},
		} as GraphQLFieldConfig<any, any, any>
	}

	private createUploadMutation(authorizator: S3ObjectAuthorizator): GraphQLFieldConfig<any, any, any> {
		return {
			type: new GraphQLNonNull(S3SignedUpload),
			args: {
				input: { type: types.S3GenerateSignedUploadInput },
				contentType: { type: GraphQLString, deprecationReason: 'Use input.contentType' },
				expiration: { type: GraphQLInt, deprecationReason: 'Use input.expiration' },
				prefix: { type: GraphQLString, deprecationReason: 'Use input.prefix' },
				acl: { type: types.S3Acl, deprecationReason: 'Use input.acl' },
			},
			resolve: async (
				parent: any,
				args: { input?: Partial<S3GenerateSignedUploadInput>; contentType?: string; acl?: S3Acl; expiration?: number; prefix?: string },
				ctx: { project: Project3Config },
			) => {
				if (!ctx.project.s3) {
					throw new GraphQLError('S3 is not configured for this project')
				}
				const s3Config = resolveS3Config(ctx.project.s3)
				const s3 = this.s3Factory.create(s3Config, this.providers, authorizator)
				return s3.getSignedUploadUrl({
					acl: args.input?.acl ?? args.acl ?? null,
					contentDisposition: args.input?.contentDisposition ?? null,
					contentType: args.input?.contentType ?? args.contentType ?? null,
					expiration: args.input?.expiration ?? args.expiration ?? null,
					extension: args.input?.extension ?? null,
					fileName: args.input?.fileName ?? null,
					prefix: args.input?.prefix ?? args.prefix ?? null,
					suffix: args.input?.suffix ?? null,
					size: args.input?.size ?? null,
				})
			},
		}
	}
}
