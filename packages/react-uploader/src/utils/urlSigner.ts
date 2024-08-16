import { GenerateUploadUrlMutationBuilder } from '@contember/client'
import { GraphQlClient } from '@contember/graphql-client'

export const createContentApiS3Signer = (client: GraphQlClient) => {

	let uploadUrlBatchParameters: GenerateUploadUrlMutationBuilder.FileParameters[] = []
	let uploadUrlBatchResult: null | Promise<GenerateUploadUrlMutationBuilder.MutationResponse> = null

	return async (parameters: GenerateUploadUrlMutationBuilder.FileParameters): Promise<GenerateUploadUrlMutationBuilder.ResponseBody> => {
		const index = uploadUrlBatchParameters.length
		uploadUrlBatchParameters.push(parameters)
		if (uploadUrlBatchResult === null) {
			uploadUrlBatchResult = (async () => {
				await new Promise(resolve => setTimeout(resolve, 0))

				const mutation = GenerateUploadUrlMutationBuilder.buildQuery(Object.fromEntries(uploadUrlBatchParameters.map((_, i) => ['url_' + i, _])))
				uploadUrlBatchResult = null
				uploadUrlBatchParameters = []

				return await client.execute<GenerateUploadUrlMutationBuilder.MutationResponse>(mutation.query, { variables: mutation.variables })
			})()
		}
		return (await uploadUrlBatchResult)[`url_${index}`]
	}
}
