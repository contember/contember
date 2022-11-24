import { test, assert } from 'vitest'
import { S3ObjectAuthorizator } from '../../src'

test('required read pattern', () => {
	const authorizator = new S3ObjectAuthorizator([], [{ pattern: 'foo/**' }])
	assert.doesNotThrow(() => authorizator.verifyReadAccess({ key: 'foo/lorem.jpg' }))
	assert.throw(() => authorizator.verifyReadAccess({ key: 'lorem.jpg' }), 'Read access forbidden for object key lorem.jpg')
})

test('required upload pattern', () => {
	const authorizator = new S3ObjectAuthorizator([{ pattern: 'foo/**' }], [])
	assert.doesNotThrow(() => authorizator.verifyUploadAccess({ key: 'foo/lorem.jpg', size: null }))
	assert.throw(() => authorizator.verifyUploadAccess({ key: 'lorem.jpg', size: null }), 'Upload access forbidden for object key lorem.jpg')
})


test('max upload size', () => {
	const authorizator = new S3ObjectAuthorizator([{ pattern: '**', maxSize: 1024 }], [])
	assert.doesNotThrow(() => authorizator.verifyUploadAccess({ key: 'lorem.jpg', size: 1000 }))
	assert.throw(() => authorizator.verifyUploadAccess({ key: 'lorem.jpg', size: null }), 'File size must be provided')
	assert.throw(() => authorizator.verifyUploadAccess({ key: 'lorem.jpg', size: 2048 }), 'Uploaded file is too large')
})
