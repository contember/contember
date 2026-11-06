import { expect, test } from 'bun:test'
import { CryptoWrapper } from '../../../src/index.js'
import * as crypto from 'node:crypto'

const encryptionKey = crypto.createSecretKey(Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'))
const iv = Buffer.alloc(16).fill('a')
const algorithm = CryptoWrapper.cryptoAlgo

const assert = {
	strictEqual: (a: any, b: any) => expect(a).toBe(b),
}

const encryptOld = (data: Buffer) => {
	const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv)
	return Buffer.concat([cipher.update(data), iv])
}

test('encryption v1 16 chars string (block size)', async () => {
	const cryptoWrapper = new CryptoWrapper(encryptionKey)
	const input = 'a'.repeat(16)
	const inputBuffer = Buffer.from(input)
	assert.strictEqual(inputBuffer.length, 16)
	const value = encryptOld(inputBuffer)
	const decrypted = await cryptoWrapper.decrypt(value, 1)
	assert.strictEqual(decrypted.needsReEncrypt, true)
	assert.strictEqual(decrypted.value.toString(), input)
})

test('encryption v1 17 chars string', async () => {
	const cryptoWrapper = new CryptoWrapper(encryptionKey)
	const input = 'a'.repeat(17)
	const inputBuffer = Buffer.from(input)
	assert.strictEqual(inputBuffer.length, 17)
	const value = encryptOld(inputBuffer)
	const decrypted = await cryptoWrapper.decrypt(value, 1)
	assert.strictEqual(decrypted.needsReEncrypt, true)
	assert.strictEqual(decrypted.value.toString(), input)
})

test('encryption v2 16 chars string (block size)', async () => {
	const cryptoWrapper = new CryptoWrapper(encryptionKey)
	const input = 'a'.repeat(16)
	const inputBuffer = Buffer.from(input)
	assert.strictEqual(inputBuffer.length, 16)
	const value = await cryptoWrapper.encrypt(inputBuffer)
	assert.strictEqual(value.version, 2)
	const decrypted = await cryptoWrapper.decrypt(value.value, value.version)
	assert.strictEqual(decrypted.needsReEncrypt, false)
	assert.strictEqual(decrypted.value.toString(), input)
})

test('encryption v2 17 chars string', async () => {
	const cryptoWrapper = new CryptoWrapper(encryptionKey)
	const input = 'a'.repeat(17)
	const inputBuffer = Buffer.from(input)
	assert.strictEqual(inputBuffer.length, 17)
	const value = await cryptoWrapper.encrypt(inputBuffer)
	assert.strictEqual(value.version, 2)
	const decrypted = await cryptoWrapper.decrypt(value.value, value.version)
	assert.strictEqual(decrypted.needsReEncrypt, false)
	assert.strictEqual(decrypted.value.toString(), input)
})

test('encryption v2: corrupted auth key', async () => {
	const cryptoWrapper = new CryptoWrapper(encryptionKey)
	const inputBuffer = Buffer.from('ab')
	const value = await cryptoWrapper.encrypt(inputBuffer)
	let err: any = { message: 'not failed' }
	try {
		const corrupted = value.value.swap16()
		await cryptoWrapper.decrypt(corrupted, value.version)
	} catch (e) {
		err = e
	}
	assert.strictEqual('Unsupported state or unable to authenticate data', err.message)
})

test('signing is deterministic and bound to its purpose and key', () => {
	const cryptoWrapper = new CryptoWrapper(encryptionKey)
	const value = Buffer.from('payload')
	const signature = cryptoWrapper.sign('first', value)
	expect(signature).toHaveLength(32)
	expect(cryptoWrapper.sign('first', value).equals(signature)).toBe(true)
	expect(cryptoWrapper.sign('second', value).equals(signature)).toBe(false)
	expect(crypto.createHmac('sha256', encryptionKey).update(value).digest().equals(signature)).toBe(false)
	const otherKey = crypto.createSecretKey(Buffer.alloc(32, 1))
	expect(new CryptoWrapper(otherKey).sign('first', value).equals(signature)).toBe(false)
})

test('signing without an encryption key fails', () => {
	expect(() => new CryptoWrapper().sign('first', Buffer.from('payload'))).toThrow('encryption key not provided')
})
