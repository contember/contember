import { test, assert, expect } from 'vitest'
import { S3ObjectAuthorizator, S3Service } from '../../src'

const mocked = new Date('2021-07-02T17:22Z')
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
	new S3ObjectAuthorizator([{ pattern: '**' }], [{ pattern: '**' }]),
)


test('sign s3 request', () => {
	const service = createS3Service('test')
	const signed = service.getSignedReadUrl({ objectKey: 'foo.jpg', expiration: null })
	expect(signed.url).toMatchInlineSnapshot('"https://test.s3.eu-central-1.amazonaws.com/foo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test%2F20210702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20210702T172200Z&X-Amz-Expires=3600&X-Amz-Signature=00e912fe0383066802fc6c0f93ffb223320ca143992385fe69070bbb87c758dc&X-Amz-SignedHeaders=host"')
})

test('sign s3 request - prefix', () => {
	const service = createS3Service('test', 'lorem')
	const signed = service.getSignedReadUrl({ objectKey: 'lorem/foo.jpg', expiration: null })
	expect(signed.url).toMatchInlineSnapshot('"https://test.s3.eu-central-1.amazonaws.com/lorem/foo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test%2F20210702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20210702T172200Z&X-Amz-Expires=3600&X-Amz-Signature=f6c69dc306422c2b3242c9d9d42147336817720ffae249af8bd91cc7062e9f6d&X-Amz-SignedHeaders=host"')
})

test('sign upload', () => {
	const service = createS3Service('test')
	const signed = service.getSignedUploadUrl({ contentType: 'image/jpeg', acl: 'PUBLIC_READ', expiration: 1800, contentDisposition: null, extension: null, fileName: null, prefix: null, suffix: null, size: null })
	expect(signed.url).toMatchInlineSnapshot('"https://test.s3.eu-central-1.amazonaws.com/9fce3907-ff2b-45bb-b4ce-eff5527dd315.jpeg?Cache-Control=immutable&Content-Type=image%2Fjpeg&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test%2F20210702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20210702T172200Z&X-Amz-Expires=1800&X-Amz-Signature=fcd00b967054c19a2ee64b59e31d61e032ea086dcf2f0d8c36a883971c469c99&X-Amz-SignedHeaders=cache-control%3Bhost%3Bx-amz-acl&x-amz-acl=public-read"')
})

test('sign upload #2', () => {
	const service = createS3Service('test')
	const signed = service.getSignedUploadUrl({ contentType: 'image/jpeg', acl: 'PUBLIC_READ', expiration: 1800, contentDisposition: 'INLINE', extension: 'jpeg', fileName: 'foo-bar.jpeg', prefix: 'foo', suffix: 'bar', size: null })
	expect(signed.url).toMatchInlineSnapshot('"https://test.s3.eu-central-1.amazonaws.com/foo/9fce3907-ff2b-45bb-b4ce-eff5527dd315bar.jpeg?Cache-Control=immutable&Content-Type=image%2Fjpeg&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test%2F20210702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20210702T172200Z&X-Amz-Expires=1800&X-Amz-Signature=979a93bca65a98ce6b2bf97d2bf2afe7d5f2fa805f7d596187675416c86a3bd5&X-Amz-SignedHeaders=cache-control%3Bcontent-disposition%3Bhost%3Bx-amz-acl&x-amz-acl=public-read"')
})


test('bucket with dot', () => {
	const service = createS3Service('test.foo')
	const signed = service.getSignedReadUrl({ objectKey: 'foo.jpg', expiration: null })
	expect(signed.url).toMatchInlineSnapshot('"https://s3.eu-central-1.amazonaws.com/test.foo/foo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test%2F20210702%2Feu-central-1%2Fs3%2Faws4_request&X-Amz-Date=20210702T172200Z&X-Amz-Expires=3600&X-Amz-Signature=811a809196e60413e0e54e51d3dd91ab73ad1482b61e5371864d25d43ba642ff&X-Amz-SignedHeaders=host"')
})

