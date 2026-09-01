import { describe, expect, test } from 'bun:test'
import { READ_AFTER_WRITE_HEADERS, WriteRefTracker } from '../../../src/index.js'

const responseWith = (headers: Record<string, string>): Response => new Response('{}', { headers })

const writeRef = (token: string) => responseWith({ [READ_AFTER_WRITE_HEADERS.writeRef]: token })

const createClock = () => {
	let time = 1_000
	return {
		now: () => time,
		advance: (ms: number) => {
			time += ms
		},
	}
}

describe('WriteRefTracker', () => {
	test('starts empty and sends no header', () => {
		const tracker = new WriteRefTracker()

		expect(tracker.tokens).toEqual([])
		expect(tracker.requestHeaders()).toEqual({})
	})

	test('captures a write reference and sends it back', () => {
		const tracker = new WriteRefTracker()

		tracker.captureResponse(writeRef('123'))

		expect(tracker.tokens).toEqual(['123'])
		expect(tracker.requestHeaders()).toEqual({ [READ_AFTER_WRITE_HEADERS.readAfter]: '123' })
	})

	test('keeps insertion order and sends the tokens comma separated', () => {
		const tracker = new WriteRefTracker()

		tracker.captureResponse(writeRef('a'))
		tracker.captureResponse(writeRef('b'))
		tracker.captureResponse(writeRef('c'))

		expect(tracker.tokens).toEqual(['a', 'b', 'c'])
		expect(tracker.requestHeaders()).toEqual({ [READ_AFTER_WRITE_HEADERS.readAfter]: 'a,b,c' })
	})

	test('stores a token at most once and keeps its position', () => {
		const tracker = new WriteRefTracker()

		tracker.captureResponse(writeRef('a'))
		tracker.captureResponse(writeRef('b'))
		tracker.captureResponse(writeRef('a'))

		expect(tracker.tokens).toEqual(['a', 'b'])
	})

	test('drops a token once its ttl passes', () => {
		const clock = createClock()
		const tracker = new WriteRefTracker({ ttlMs: 100, now: clock.now })

		tracker.captureResponse(writeRef('a'))
		clock.advance(50)
		tracker.captureResponse(writeRef('b'))
		clock.advance(50)

		expect(tracker.tokens).toEqual(['b'])

		clock.advance(50)

		expect(tracker.requestHeaders()).toEqual({})
	})

	test('re-adding a token refreshes its ttl', () => {
		const clock = createClock()
		const tracker = new WriteRefTracker({ ttlMs: 100, now: clock.now })

		tracker.captureResponse(writeRef('a'))
		clock.advance(80)
		tracker.captureResponse(writeRef('a'))
		clock.advance(80)

		expect(tracker.tokens).toEqual(['a'])
	})

	test('evicts the oldest token above the cap', () => {
		const tracker = new WriteRefTracker({ maxTokens: 2 })

		tracker.captureResponse(writeRef('a'))
		tracker.captureResponse(writeRef('b'))
		tracker.captureResponse(writeRef('c'))

		expect(tracker.tokens).toEqual(['b', 'c'])
	})

	test('removes exactly the acknowledged tokens', () => {
		const tracker = new WriteRefTracker()

		tracker.captureResponse(writeRef('a'))
		tracker.captureResponse(writeRef('b'))
		tracker.captureResponse(writeRef('c'))
		tracker.captureResponse(responseWith({ [READ_AFTER_WRITE_HEADERS.readAfterVisible]: 'a, c' }))

		expect(tracker.tokens).toEqual(['b'])
	})

	test('keeps a token that arrives together with an acknowledgement of it', () => {
		const tracker = new WriteRefTracker()

		tracker.captureResponse(responseWith({
			[READ_AFTER_WRITE_HEADERS.readAfterVisible]: 'a',
			[READ_AFTER_WRITE_HEADERS.writeRef]: 'a',
		}))

		expect(tracker.tokens).toEqual(['a'])
	})

	test('ignores an unknown acknowledged token', () => {
		const tracker = new WriteRefTracker()

		tracker.captureResponse(writeRef('a'))
		tracker.captureResponse(responseWith({ [READ_AFTER_WRITE_HEADERS.readAfterVisible]: 'x' }))

		expect(tracker.tokens).toEqual(['a'])
	})

	test('ignores missing, empty and malformed header values', () => {
		const tracker = new WriteRefTracker()

		tracker.captureResponse(responseWith({}))
		tracker.captureResponse(responseWith({ [READ_AFTER_WRITE_HEADERS.writeRef]: '' }))
		tracker.captureResponse(responseWith({ [READ_AFTER_WRITE_HEADERS.writeRef]: '   ' }))
		tracker.captureResponse(responseWith({ [READ_AFTER_WRITE_HEADERS.writeRef]: ',,' }))
		tracker.captureResponse(responseWith({ [READ_AFTER_WRITE_HEADERS.readAfterVisible]: ',' }))

		expect(tracker.tokens).toEqual([])

		tracker.captureResponse(responseWith({ [READ_AFTER_WRITE_HEADERS.writeRef]: ' a , ,b ' }))

		expect(tracker.tokens).toEqual(['a', 'b'])
	})

	test('survives a response whose headers cannot be read', () => {
		const tracker = new WriteRefTracker()
		tracker.captureResponse(writeRef('a'))

		const throwingHeaders = new Response('{}')
		Object.defineProperty(throwingHeaders, 'headers', {
			get: () => ({
				get: () => {
					throw new Error('headers are unavailable')
				},
			}),
		})
		const missingHeaders = new Response('{}')
		Object.defineProperty(missingHeaders, 'headers', { get: () => undefined })

		expect(() => tracker.captureResponse(throwingHeaders)).not.toThrow()
		expect(() => tracker.captureResponse(missingHeaders)).not.toThrow()
		expect(tracker.tokens).toEqual(['a'])
	})

	test('does not read the response body', () => {
		const tracker = new WriteRefTracker()
		const response = writeRef('a')

		tracker.captureResponse(response)

		expect(response.bodyUsed).toBe(false)
	})
})
