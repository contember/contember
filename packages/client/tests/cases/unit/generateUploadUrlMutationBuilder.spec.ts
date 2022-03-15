import { expect, it, describe } from 'vitest'
import { GenerateUploadUrlMutationBuilder } from '../../../src/content'
import { GraphQlLiteral } from '../../../src/graphQlBuilder'

const mutationBody = `{
		url
		publicUrl
		method
		headers {
			key
			value
		}
	}`

describe('generate upload url mutation builder', () => {
	it('correctly creates a simple mutation', () => {
		expect(
			GenerateUploadUrlMutationBuilder.buildQuery({
				mySingleImage: {
					contentType: 'image/png',
				},
			}),
		).toEqual(`mutation {
	mySingleImage: generateUploadUrl(contentType: "image/png") ${mutationBody}
}`)
	})

	it('correctly creates a mutation for multiple files', () => {
		expect(
			GenerateUploadUrlMutationBuilder.buildQuery({
				myPng: {
					contentType: 'image/png',
				},
				myMp3: {
					contentType: 'audio/mpeg',
					acl: new GraphQlLiteral('PUBLIC_READ'),
					expiration: 123456,
					prefix: 'foo',
				},
			}),
		).toEqual(`mutation {
	myPng: generateUploadUrl(contentType: "image/png") ${mutationBody}
	myMp3: generateUploadUrl(contentType: "audio/mpeg", expiration: 123456, prefix: "foo", acl: PUBLIC_READ) ${mutationBody}
}`)
	})
})
