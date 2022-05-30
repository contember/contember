import { expect, it, describe } from 'vitest'
import { GenerateUploadUrlMutationBuilder } from '../../../src/content'
import { GraphQlLiteral } from '../../../src/graphQlBuilder'

describe('generate upload url mutation builder', () => {
	it('correctly creates a simple mutation', () => {
		expect(
			GenerateUploadUrlMutationBuilder.buildQuery({
				mySingleImage: {
					contentType: 'image/png',
				},
			}),
		).toMatchInlineSnapshot(`
			"mutation {
				mySingleImage: generateUploadUrl(contentType: \\"image/png\\") {
					__typename
					url
					publicUrl
					method
					headers {
						__typename
						key
						value
					}
				}
			}"
		`)
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
		).toMatchInlineSnapshot(`
			"mutation {
				myPng: generateUploadUrl(contentType: \\"image/png\\") {
					__typename
					url
					publicUrl
					method
					headers {
						__typename
						key
						value
					}
				}
				myMp3: generateUploadUrl(contentType: \\"audio/mpeg\\", expiration: 123456, prefix: \\"foo\\", acl: PUBLIC_READ) {
					__typename
					url
					publicUrl
					method
					headers {
						__typename
						key
						value
					}
				}
			}"
		`)
	})
})
