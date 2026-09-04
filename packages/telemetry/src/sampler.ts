import { TRACE_FLAG_SAMPLED } from './propagation.js'
import { Sampler } from './types.js'

const UINT32_RANGE = 0x100000000

export const alwaysSampler = (): Sampler => ({ shouldSample: () => true })

export const neverSampler = (): Sampler => ({ shouldSample: () => false })

export const ratioSampler = (ratio: number): Sampler => {
	const threshold = Math.min(Math.max(ratio, 0), 1) * UINT32_RANGE
	return {
		shouldSample: ({ traceId }) => {
			const folded = (
				Number.parseInt(traceId.slice(0, 8), 16)
				^ Number.parseInt(traceId.slice(8, 16), 16)
				^ Number.parseInt(traceId.slice(16, 24), 16)
				^ Number.parseInt(traceId.slice(24, 32), 16)
			) >>> 0
			return folded < threshold
		},
	}
}

export const parentRatioSampler = (ratio: number): Sampler => {
	const rootSampler = ratioSampler(ratio)
	return {
		shouldSample: input => input.parent ? (input.parent.traceFlags & TRACE_FLAG_SAMPLED) !== 0 : rootSampler.shouldSample(input),
	}
}
