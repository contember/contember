import { test, assert } from 'vitest'
import { S3Acl, S3Service } from '../../src'

const mocked = new Date('2021-07-02 17:22')
const constantUuid = '9fce3907-ff2b-45bb-b4ce-eff5527dd315'
const createS3Service = (bucket: string, prefix = '') => new S3Service(
	{
		bucket,
		region: 'eu-central-1',
		credentials: {
			key: 'test',
			secret: 'abcd',
		},
		prefix,
	},
	{
		uuid: () => constantUuid,
		now: () => mocked,
	},
)


test('sign s3 request', () => {
	const service = createS3Service('test')
	assert.equal(
		service.getSignedReadUrl('foo.jpg', () => {}).url,
		'https://test.s3.eu-central-1.amazonaws.com/foo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test%2F20210702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20210702T172200Z&X-Amz-Expires=3600&X-Amz-Signature=00e912fe0383066802fc6c0f93ffb223320ca143992385fe69070bbb87c758dc&X-Amz-SignedHeaders=host',
	)
})

test('sign s3 request - prefix', () => {
	const service = createS3Service('test', 'lorem')
	assert.equal(
		service.getSignedReadUrl('lorem/foo.jpg', () => {}).url,
		'https://test.s3.eu-central-1.amazonaws.com/lorem/foo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test%2F20210702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20210702T172200Z&X-Amz-Expires=3600&X-Amz-Signature=f6c69dc306422c2b3242c9d9d42147336817720ffae249af8bd91cc7062e9f6d&X-Amz-SignedHeaders=host',
	)
})

test('sign upload', () => {
	const service = createS3Service('test')
	assert.equal(
		service.getSignedUploadUrl('foo.jpg', () => {}, S3Acl.PublicRead, 1800).url,
		`https://test.s3.eu-central-1.amazonaws.com/${constantUuid}.bin?Cache-Control=immutable&Content-Type=foo.jpg&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test%2F20210702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20210702T172200Z&X-Amz-Expires=1800&X-Amz-Signature=d33b2d6574fca41d7f707fd3d4695712380f78a0e9e0b0ace3fc12d7a4606bc2&X-Amz-SignedHeaders=cache-control%3Bhost%3Bx-amz-acl&x-amz-acl=public-read`,
	)
})

test('bucket with dot', () => {
	const service = createS3Service('test.foo')
	assert.equal(
		service.getSignedReadUrl('foo.jpg', () => {}).url,
		'https://s3.eu-central-1.amazonaws.com/test.foo/foo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test%2F20210702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20210702T172200Z&X-Amz-Expires=3600&X-Amz-Signature=811a809196e60413e0e54e51d3dd91ab73ad1482b61e5371864d25d43ba642ff&X-Amz-SignedHeaders=host',
	)
})

