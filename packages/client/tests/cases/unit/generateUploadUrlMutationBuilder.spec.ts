import { expect, it, describe } from 'vitest'
import { GenerateUploadUrlMutationBuilder } from '../../../src/content'

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
			  "query": "mutation($String_0: String) {
				mySingleImage: generateUploadUrl(contentType: $String_0) {
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
			    "String_0": "image/png",
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
					acl: 'PUBLIC_READ',
					expiration: 123456,
					prefix: 'foo',
				},
			}),
		).toMatchInlineSnapshot(`
			{
			  "query": "mutation($String_0: String, $String_1: String, $Int_2: Int, $String_3: String, $S3Acl_4: S3Acl) {
				myPng: generateUploadUrl(contentType: $String_0) {
					url
					publicUrl
					method
					headers {
						key
						value
					}
				}
				myMp3: generateUploadUrl(contentType: $String_1, expiration: $Int_2, prefix: $String_3, acl: $S3Acl_4) {
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
			    "Int_2": 123456,
			    "S3Acl_4": "PUBLIC_READ",
			    "String_0": "image/png",
			    "String_1": "audio/mpeg",
			    "String_3": "foo",
			  },
			}
		`)
	})
})
