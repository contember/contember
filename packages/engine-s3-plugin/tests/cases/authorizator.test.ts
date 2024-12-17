import { test, expect } from 'bun:test'
import { S3ObjectAuthorizator } from '../../src'

test('required read pattern', () => {
	const authorizator = new S3ObjectAuthorizator([], [{ pattern: 'foo/**' }])
	expect(() => authorizator.verifyReadAccess({ key: 'foo/lorem.jpg' })).not.toThrow()
	expect(() => authorizator.verifyReadAccess({ key: 'lorem.jpg' })).toThrow('Read access forbidden for object key lorem.jpg')
})

test('required upload pattern', () => {
	const authorizator = new S3ObjectAuthorizator([{ pattern: 'foo/**' }], [])
	expect(() => authorizator.verifyUploadAccess({ key: 'foo/lorem.jpg', size: null })).not.toThrow()
	expect(() => authorizator.verifyUploadAccess({ key: 'lorem.jpg', size: null })).toThrow('Upload access forbidden for object key lorem.jpg')
})


test('max upload size', () => {
	const authorizator = new S3ObjectAuthorizator([{ pattern: '**', maxSize: 1024 }], [])
	expect(() => authorizator.verifyUploadAccess({ key: 'lorem.jpg', size: 1000 })).not.toThrow()
	expect(() => authorizator.verifyUploadAccess({ key: 'lorem.jpg', size: null })).toThrow('File size must be provided')
	expect(() => authorizator.verifyUploadAccess({ key: 'lorem.jpg', size: 2048 })).toThrow('Uploaded file is too large')
})
