import { GraphQlLiteral } from '../../graphQlBuilder'
import { GraphQlField, GraphQlPrintResult, GraphQlQueryPrinter, GraphQlSelectionSetItem } from '@contember/graphql-builder'
import { GraphQlBuilder } from '../../index'
import { replaceGraphQlLiteral } from '../replaceGraphQlLiteral'

class GenerateUploadUrlMutationBuilder {
	private static generateUploadUrlFields = [
		new GraphQlField(null, 'url'),
		new GraphQlField(null, 'publicUrl'),
		new GraphQlField(null, 'method'),
		new GraphQlField(null, 'headers', {}, [
			new GraphQlField(null, 'key'),
			new GraphQlField(null, 'value'),
		]),
	]
	/**
	 * @internal
	 */
	public static buildQuery(parameters: GenerateUploadUrlMutationBuilder.MutationParameters): GraphQlPrintResult {
		const selectionItems: GraphQlSelectionSetItem[] = []
		for (const alias in parameters) {
			const fileParameters = parameters[alias]
			if (fileParameters.suffix || fileParameters.fileName || fileParameters.extension) {
				const value = replaceGraphQlLiteral(fileParameters)
				selectionItems.push(new GraphQlField(alias, 'generateUploadUrl', {
					input: {
						value: value,
						graphQlType: 'S3GenerateSignedUploadInput',
					},
				}, GenerateUploadUrlMutationBuilder.generateUploadUrlFields))
			} else {
				selectionItems.push(new GraphQlField(alias, 'generateUploadUrl', {
					contentType: {
						graphQlType: 'String',
						value: fileParameters.contentType,
					},
					expiration: {
						graphQlType: 'Int',
						value: fileParameters.expiration,
					},
					prefix: {
						graphQlType: 'String',
						value: fileParameters.prefix,
					},
					acl: {
						graphQlType: 'S3Acl',
						value: fileParameters.acl instanceof GraphQlBuilder.GraphqlLiteral ? fileParameters.acl?.value : fileParameters.acl,
					},
				}, GenerateUploadUrlMutationBuilder.generateUploadUrlFields))
			}
		}

		const printer = new GraphQlQueryPrinter()
		return printer.printDocument('mutation', selectionItems, {})
	}
}

namespace GenerateUploadUrlMutationBuilder {
	export type Acl =
		| 'PUBLIC_READ'
		| 'PRIVATE'
		| 'NONE'
		| GraphQlLiteral<'PUBLIC_READ' | 'PRIVATE' | 'NONE'>

	export type FileParameters = {
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
