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
			{
			  "query": "mutation($contentType_String_0: String) {
				mySingleImage: generateUploadUrl(contentType: $contentType_String_0) {
					url
					publicUrl
					method
					headers {
						key
						value
					}
				}
			}
			",
			  "variables": {
			    "contentType_String_0": "image/png",
			  },
			}
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
			{
			  "query": "mutation($contentType_String_0: String, $contentType_String_1: String, $expiration_Int_2: Int, $prefix_String_3: String, $acl_S3Acl_4: S3Acl) {
				myPng: generateUploadUrl(contentType: $contentType_String_0) {
					url
					publicUrl
					method
					headers {
						key
						value
					}
				}
				myMp3: generateUploadUrl(contentType: $contentType_String_1, expiration: $expiration_Int_2, prefix: $prefix_String_3, acl: $acl_S3Acl_4) {
					url
					publicUrl
					method
					headers {
						key
						value
					}
				}
			}
			",
			  "variables": {
			    "acl_S3Acl_4": "PUBLIC_READ",
			    "contentType_String_0": "image/png",
			    "contentType_String_1": "audio/mpeg",
			    "expiration_Int_2": 123456,
			    "prefix_String_3": "foo",
			  },
			}
		`)
	})
})
