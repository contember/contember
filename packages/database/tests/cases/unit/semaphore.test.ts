import { expect, it } from 'bun:test'
import { Semaphore } from '../../../src/utils/index.js'

const timeout = async (ms = 1) => await new Promise<void>(resolve => setTimeout(resolve, ms))

it('limits concurrency to the configured number of slots', async () => {
	const semaphore = new Semaphore(2)
	let active = 0
	let maxActive = 0

	const task = async () => {
		await semaphore.execute(async () => {
			active++
			maxActive = Math.max(maxActive, active)
			await timeout(5)
			active--
		})
	}

	await Promise.all(Array.from({ length: 6 }, () => task()))

	expect(maxActive).toBe(2)
})

it('preserves FIFO ordering of queued tasks', async () => {
	const semaphore = new Semaphore(1)
	const order: number[] = []

	await Promise.all([1, 2, 3].map(i =>
		semaphore.execute(async () => {
			order.push(i)
			await timeout(1)
		})
	))

	expect(order).toEqual([1, 2, 3])
})

it('releases the slot even when the callback throws', async () => {
	const semaphore = new Semaphore(1)

	await expect(semaphore.execute(async () => {
		throw new Error('boom')
	})).rejects.toThrow('boom')

	// if the slot was not released, this would hang forever
	const result = await semaphore.execute(async () => 'ok')
	expect(result).toBe('ok')
})

it('rejects an invalid concurrency value', () => {
	expect(() => new Semaphore(0)).toThrow()
})
