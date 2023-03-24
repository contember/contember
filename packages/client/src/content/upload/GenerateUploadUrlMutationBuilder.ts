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
				if (fileParameters.suffix || fileParameters.fileName || fileParameters.extension) {
					builder = builder.object(
						alias,
						GenerateUploadUrlMutationBuilder.generateUploadUrlFields
							.argument('input', fileParameters),
					)
				} else {
					// BC
					builder = builder.object(
						alias,
						GenerateUploadUrlMutationBuilder.generateUploadUrlFields
							.argument('contentType', fileParameters.contentType)
							.argument('expiration', fileParameters.expiration)
							.argument('prefix', fileParameters.prefix)
							.argument('acl', fileParameters.acl),
					)
				}
			}

			return builder
		})
	}
}

namespace GenerateUploadUrlMutationBuilder {
	export type Acl = GraphQlLiteral<'PUBLIC_READ' | 'PRIVATE' | 'NONE'>;

	export interface FileParameters {
		contentType: string
		expiration?: number
		size?: number
		prefix?: string
		extension?: string
		suffix?: string
		fileName?: string
		acl?: Acl
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
