import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { S3Acl, S3Service } from '../../src'

const mocked = new Date('2021-07-02 17:22')
const constantUuid = '9fce3907-ff2b-45bb-b4ce-eff5527dd315'
const service = new S3Service(
	{
		bucket: 'test',
		region: 'eu-central-1',
		credentials: {
			key: 'test',
			secret: 'abcd',
		},
		prefix: '',
	},
	{
		uuid: () => constantUuid,
		now: () => mocked,
	},
)
test('sign s3 request', () => {
	assert.equal(
		service.getSignedReadUrl('foo.jpg', () => {}).url,
		'https://test.s3.eu-central-1.amazonaws.com/oo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test%2F20210702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20210702T172200Z&X-Amz-Expires=3600&X-Amz-Signature=8bcf085f3111f225131efec0831ecd38c3c8cd8ff6163075a0d48f58d524363b&X-Amz-SignedHeaders=host',
	)
})
test('sign upload', () => {
	assert.equal(
		service.getSignedUploadUrl('foo.jpg', () => {}, S3Acl.PublicRead, 1800).url,
		`https://test.s3.eu-central-1.amazonaws.com/${constantUuid}.bin?Cache-Control=immutable&Content-Type=foo.jpg&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test%2F20210702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20210702T172200Z&X-Amz-Expires=1800&X-Amz-Signature=d33b2d6574fca41d7f707fd3d4695712380f78a0e9e0b0ace3fc12d7a4606bc2&X-Amz-SignedHeaders=cache-control%3Bhost%3Bx-amz-acl&x-amz-acl=public-read`,
	)
})
test.run()
