import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { Label } from '../src/ui/label.js'
import { Progress } from '../src/ui/progress.js'
import { Separator } from '../src/ui/separator.js'
import { Toggle } from '../src/ui/toggle.js'

afterEach(cleanup)

describe('Label', () => {
	test('renders a label bound to its control', () => {
		const { getByText } = render(<Label htmlFor="name">Name</Label>)
		const label = getByText('Name')
		expect(label.tagName).toBe('LABEL')
		expect(label.getAttribute('for')).toBe('name')
	})

	test('prevents text selection on a double click, not on a single one', () => {
		const onMouseDown = mock(() => {})
		const { getByText } = render(<Label onMouseDown={onMouseDown}>Name</Label>)
		const label = getByText('Name')
		expect(fireEvent.mouseDown(label, { detail: 1 })).toBe(true)
		expect(fireEvent.mouseDown(label, { detail: 2 })).toBe(false)
		expect(onMouseDown).toHaveBeenCalledTimes(2)
	})

	test('leaves mouse down on a nested control alone', () => {
		const onMouseDown = mock(() => {})
		const { getByRole } = render(
			<Label onMouseDown={onMouseDown}>
				Name <input />
			</Label>,
		)
		expect(fireEvent.mouseDown(getByRole('textbox'), { detail: 2 })).toBe(true)
		expect(onMouseDown).not.toHaveBeenCalled()
	})
})

describe('Separator', () => {
	test('is a horizontal separator by default', () => {
		const { container } = render(<Separator />)
		const el = container.firstElementChild
		expect(el?.getAttribute('role')).toBe('separator')
		expect(el?.getAttribute('data-orientation')).toBe('horizontal')
		expect(el?.hasAttribute('aria-orientation')).toBe(false)
		expect(el?.className).toBe('shrink-0 bg-border')
	})

	test('a vertical separator gets its classes and exposes its orientation', () => {
		const { container } = render(<Separator orientation="vertical" />)
		const el = container.firstElementChild
		expect(el?.className).toBe('shrink-0 bg-border h-full w-[1px]')
		expect(el?.getAttribute('data-orientation')).toBe('vertical')
		expect(el?.getAttribute('aria-orientation')).toBe('vertical')
	})

	test('decorative separators are hidden from assistive technology', () => {
		const { container } = render(<Separator decorative />)
		expect(container.firstElementChild?.getAttribute('role')).toBe('none')
	})
})

describe('Progress', () => {
	test('renders a progressbar with the indicator offset by the value', () => {
		const { getByRole } = render(<Progress value={30} />)
		const bar = getByRole('progressbar')
		expect(bar.getAttribute('aria-valuemin')).toBe('0')
		expect(bar.getAttribute('aria-valuemax')).toBe('100')
		expect(bar.getAttribute('data-max')).toBe('100')
		expect(bar.getAttribute('aria-valuenow')).toBe('30')
		expect(bar.getAttribute('aria-valuetext')).toBe('30%')
		expect(bar.getAttribute('data-state')).toBe('loading')
		const indicator = bar.firstElementChild
		expect(indicator instanceof HTMLElement ? indicator.style.transform : undefined).toBe('translateX(-70%)')
		expect(indicator?.getAttribute('data-max')).toBe('100')
	})
})

describe('Progress max validation', () => {
	test('falls back to 100 and reports an invalid max', () => {
		const consoleError = spyOn(console, 'error').mockImplementation(() => {})
		try {
			const { getByRole } = render(<Progress max={-1} />)
			const bar = getByRole('progressbar')
			expect(bar.getAttribute('aria-valuemax')).toBe('100')
			expect(bar.getAttribute('data-state')).toBe('indeterminate')
			expect(consoleError).toHaveBeenCalledTimes(1)
		} finally {
			consoleError.mockRestore()
		}
	})

	test('accepts a valid max', () => {
		const { getByRole } = render(<Progress max={50} />)
		expect(getByRole('progressbar').getAttribute('aria-valuemax')).toBe('50')
	})

	test('a complete bar and an out-of-range value', () => {
		const consoleError = spyOn(console, 'error').mockImplementation(() => {})
		try {
			const { getAllByRole } = render(
				<>
					<Progress value={50} max={50} />
					<Progress value={150} />
				</>,
			)
			const [complete, outOfRange] = getAllByRole('progressbar')
			expect(complete.getAttribute('data-state')).toBe('complete')
			expect(complete.getAttribute('aria-valuetext')).toBe('100%')
			expect(outOfRange.getAttribute('data-state')).toBe('indeterminate')
			expect(outOfRange.hasAttribute('aria-valuenow')).toBe(false)
			expect(consoleError).toHaveBeenCalledTimes(1)
		} finally {
			consoleError.mockRestore()
		}
	})
})

describe('Toggle', () => {
	test('toggles its pressed state when uncontrolled', () => {
		const onPressedChange = mock((_pressed: boolean) => {})
		const { getByRole } = render(<Toggle onPressedChange={onPressedChange}>B</Toggle>)
		const button = getByRole('button')
		expect(button.getAttribute('type')).toBe('button')
		expect(button.getAttribute('aria-pressed')).toBe('false')
		expect(button.getAttribute('data-state')).toBe('off')
		fireEvent.click(button)
		expect(button.getAttribute('aria-pressed')).toBe('true')
		expect(button.getAttribute('data-state')).toBe('on')
		expect(onPressedChange).toHaveBeenLastCalledWith(true)
	})

	test('reports changes but keeps the controlled value', () => {
		const onPressedChange = mock((_pressed: boolean) => {})
		const { getByRole } = render(<Toggle pressed onPressedChange={onPressedChange}>B</Toggle>)
		const button = getByRole('button')
		fireEvent.click(button)
		expect(onPressedChange).toHaveBeenLastCalledWith(false)
		expect(button.getAttribute('aria-pressed')).toBe('true')
	})

	test('does nothing when disabled or when onClick prevents the default', () => {
		const onPressedChange = mock((_pressed: boolean) => {})
		const { getAllByRole } = render(
			<>
				<Toggle disabled onPressedChange={onPressedChange}>A</Toggle>
				<Toggle onClick={event => event.preventDefault()} onPressedChange={onPressedChange}>B</Toggle>
			</>,
		)
		const [disabled, prevented] = getAllByRole('button')
		expect(disabled.getAttribute('data-disabled')).toBe('')
		fireEvent.click(disabled)
		fireEvent.click(prevented)
		expect(onPressedChange).not.toHaveBeenCalled()
		expect(prevented.getAttribute('aria-pressed')).toBe('false')
	})
})
