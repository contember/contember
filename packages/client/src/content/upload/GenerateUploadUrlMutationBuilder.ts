import { GraphQlLiteral, ObjectBuilder, QueryBuilder } from '../../graphQlBuilder'

class GenerateUploadUrlMutationBuilder {
	private static generateUploadUrlFields = new ObjectBuilder()
		.name('generateUploadUrl')
		.field('url')
		.field('publicUrl')
		.field('method')
		.object('headers', builder => builder.field('key').field('value'))

	public static buildQuery(parameters: GenerateUploadUrlMutationBuilder.MutationParameters): string {
		return new QueryBuilder().mutation(builder => {
			for (const alias in parameters) {
				const fileParameters = parameters[alias]

				builder = builder.object(
					alias,
					GenerateUploadUrlMutationBuilder.generateUploadUrlFields
						.argument('contentType', fileParameters.contentType)
						.argument('expiration', fileParameters.expiration)
						.argument('prefix', fileParameters.prefix)
						.argument('acl', fileParameters.acl),
				)
			}

			return builder
		})
	}
}

namespace GenerateUploadUrlMutationBuilder {
	export interface FileParameters {
		contentType: string
		expiration?: number
		prefix?: string
		acl?: GraphQlLiteral<'PUBLIC_READ' | 'PRIVATE' | 'NONE'>
	}

	export interface MutationParameters {
		[alias: string]: FileParameters
	}

	export interface ResponseBody {
		url: string
		publicUrl: string
		method: string
		headers: Array<{
			key: string
			value: string
		}>
	}

	export interface MutationResponse {
		[alias: string]: ResponseBody
	}
}

export { GenerateUploadUrlMutationBuilder }
