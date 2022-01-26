import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { ProjectGroupResolver } from '../src/services/ProjectGroupResolver'
import { BadRequestError } from '../src/BadRequestError'

test('ProjectGroupResolver.resolver', () => {
	assert.is(new ProjectGroupResolver(undefined).resolve('example.com'), undefined)
	assert.is(new ProjectGroupResolver('{group}.example.com').resolve('foo.example.com'), 'foo')
	assert.is(new ProjectGroupResolver('{group}.*.com').resolve('foo.example.com'), 'foo')

	assert.throws(
		() => new ProjectGroupResolver('{group}.example.com').resolve('example.com'),
		(error: any) => error instanceof BadRequestError && error.code === 500,
	)

	assert.throws(
		() => new ProjectGroupResolver('{group}.example.com').resolve('foo.example.comX'),
		(error: any) => error instanceof BadRequestError && error.code === 500,
	)

	assert.throws(
		() => new ProjectGroupResolver('{group}.example.com').resolve('foo.bar.example.com'),
		(error: any) => error instanceof BadRequestError && error.code === 500,
	)
})

test.run()
