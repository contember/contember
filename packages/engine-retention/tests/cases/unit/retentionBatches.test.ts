import { describe, expect, test } from 'bun:test'
import { runRetentionBatches } from '../../../src/RawRetentionExecutor.js'

describe('runRetentionBatches', () => {
	test('stops once a batch prunes fewer rows than the batch size', async () => {
		const batchSizes: number[] = []
		const affected = [500, 500, 137] // last batch < batchSize ⇒ done
		let i = 0
		const total = await runRetentionBatches({ batchSize: 500, maxPerRun: 1_000_000 }, async batchSize => {
			batchSizes.push(batchSize)
			return affected[i++]
		})
		expect(total).toBe(1137)
		expect(batchSizes).toStrictEqual([500, 500, 500])
	})

	test('stops immediately when the first batch is empty', async () => {
		let calls = 0
		const total = await runRetentionBatches({ batchSize: 500, maxPerRun: 1_000_000 }, async () => {
			calls++
			return 0
		})
		expect(total).toBe(0)
		expect(calls).toBe(1)
	})

	test('honors maxPerRun as a hard cap and shrinks the final batch', async () => {
		const batchSizes: number[] = []
		const total = await runRetentionBatches({ batchSize: 400, maxPerRun: 1000 }, async batchSize => {
			batchSizes.push(batchSize)
			return batchSize // every batch full ⇒ keeps going until the cap
		})
		expect(total).toBe(1000)
		// 400 + 400 + 200 (final batch shrunk to not exceed maxPerRun)
		expect(batchSizes).toStrictEqual([400, 400, 200])
	})

	test('a full final batch that hits the cap does not run an extra empty batch', async () => {
		let calls = 0
		const total = await runRetentionBatches({ batchSize: 500, maxPerRun: 1000 }, async batchSize => {
			calls++
			return batchSize
		})
		expect(total).toBe(1000)
		expect(calls).toBe(2)
	})
})
