import { afterEach, expect, spyOn, test } from 'bun:test'
import { cleanup, render } from '@testing-library/react'
import { ErrorBoundary } from '../../src/index.js'

afterEach(cleanup)

const Throwing = (): never => {
	throw new Error('render failed')
}

test('renders children when nothing throws', () => {
	const result = render(
		<ErrorBoundary fallback={<span>fallback</span>}>
			<span>content</span>
		</ErrorBoundary>,
	)
	expect(result.container.textContent).toBe('content')
})

test('renders the fallback when a child throws', () => {
	const consoleError = spyOn(console, 'error').mockImplementation(() => {})
	try {
		const result = render(
			<div>
				<ErrorBoundary fallback={<span>fallback</span>}>
					<Throwing />
				</ErrorBoundary>
				<span>sibling</span>
			</div>,
		)
		expect(result.container.textContent).toBe('fallbacksibling')
	} finally {
		consoleError.mockRestore()
	}
})
