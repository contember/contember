import { test, assert } from 'vitest'
import { ProjectGroupResolver } from '../src/services/ProjectGroupResolver'
import { BadRequestError } from '../src/BadRequestError'

test('ProjectGroupResolver.resolver', () => {
	assert.equal(new ProjectGroupResolver(undefined).resolve('example.com'), undefined)
	assert.equal(new ProjectGroupResolver('{group}.example.com').resolve('foo.example.com'), 'foo')
	assert.equal(new ProjectGroupResolver('{group}.*.com').resolve('foo.example.com'), 'foo')

	assert.throws(
		() => new ProjectGroupResolver('{group}.example.com').resolve('example.com'),
		BadRequestError,
		'Unable to resolve hostname example.com',
	)

	assert.throws(
		() => new ProjectGroupResolver('{group}.example.com').resolve('foo.example.comX'),
		BadRequestError,
		'Unable to resolve hostname foo.example.comX',
	)

	assert.throws(
		() => new ProjectGroupResolver('{group}.example.com').resolve('foo.bar.example.com'),
		BadRequestError,
		'Unable to resolve hostname foo.bar.example.com',
	)
})

