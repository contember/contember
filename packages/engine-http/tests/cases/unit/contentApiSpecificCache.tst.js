import * as assert from 'node:assert'
import { ContentApiSpecificCache } from '../../../dist/production/content/ContentApiSpecificCache.js'

/**
 * Probably not possible to pass --expose-gc through vitest (--expose-gc cannot be in NODE_OPTIONS)
 */
(async () => {
	if (!global.gc) {
		throw new Error('Pass --expose-gc')
	}

	(() => {
		const value = {}
		const objectKey = {}
		const cache = new ContentApiSpecificCache({})
		assert.ok(cache.fetch(objectKey, '', () => value) === value)
		// eslint-disable-next-line no-console
		console.log('create value OK')
	})()

	await (() => {
		const value = {}
		const objectKey = {}
		const cache = new ContentApiSpecificCache({})
		assert.ok(cache.fetch(objectKey, '', () => value) === value)

		assert.ok(cache.fetch(objectKey, '', () => {
			throw new Error('should not happen')
		}) === value)
		// eslint-disable-next-line no-console
		console.log('repeated fetch OK')
	})()

	await (async () => {
		let value = { a: 1 }
		const valueRef = new WeakRef(value)

		let objectKey = {}
		const cache = new ContentApiSpecificCache({})

		;(() => {
			assert.ok(cache.fetch(objectKey, '', () => value) === value)
		})()

		value = { a: 2 }
		objectKey = {} // weakmap should gc value

		await new Promise(resolve => setImmediate(resolve))

		global.gc?.()

		assert.ok(valueRef.deref() === undefined)

		const value2 = {}
		assert.ok(cache.fetch(objectKey, '', () => value2) === value2)
		// eslint-disable-next-line no-console
		console.log('weakmap clear OK')
	})()

	await (async () => {
		let value = { a: 1 }
		const valueRef = new WeakRef(value)
		const objectKey = {}
		const cache = new ContentApiSpecificCache({
			ttlSeconds: 1,
		})
		assert.ok(cache.fetch(objectKey, '', () => value) === value)

		await new Promise(resolve => setTimeout(resolve, 100))
		global.gc?.()
		assert.ok(valueRef.deref() !== undefined)


		cache.fetch(objectKey, '', () => {
			throw new Error('should not happen')
		})

		// eslint-disable-next-line no-console
		console.log('ttl not expired OK')
	})()


	await (async () => {
		let value = { a: 1 }
		const valueRef = new WeakRef(value)
		const objectKey = {}
		const cache = new ContentApiSpecificCache({
			ttlSeconds: 0.200,
		})
		assert.ok(cache.fetch(objectKey, '', () => value) === value)

		for (let i = 0; i < 10; i++) {
			await new Promise(resolve => setTimeout(resolve, 100))
			global.gc?.()
			assert.ok(valueRef.deref() !== undefined)
			cache.fetch(objectKey, '', () => {
				throw new Error('should not happen')
			})
		}

		// eslint-disable-next-line no-console
		console.log('ttl renew OK')
	})()

	await (async () => {
		let value = { a: 1 }
		const valueRef = new WeakRef(value)
		const objectKey = {}
		const cache = new ContentApiSpecificCache({
			ttlSeconds: 0.100,
		})
		assert.ok(cache.fetch(objectKey, '', () => value) === value)

		value = { a: 2 }
		await new Promise(resolve => setTimeout(resolve, 500))
		global.gc?.()

		assert.ok(valueRef.deref() === undefined)

		const value2 = {}
		assert.ok(cache.fetch(objectKey, '', () => value2) === value2)

		// eslint-disable-next-line no-console
		console.log('ttl expired OK')
	})()

	// eslint-disable-next-line no-console
	console.log('content api cache test DONE')
})()
