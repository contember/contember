import classNames from 'classnames'
import { KeyboardEventHandler, MouseEventHandler } from 'react'
import { forwardRef, memo, useCallback } from 'react'
import { useComponentClassName } from '../../auxiliary'
import { toStateClass } from '../../utils'

interface MenuExpandToggleProps {
	controls: string
	disabled: boolean
	checked: boolean
	onChange: (checked: boolean) => void
}

export const MenuExpandToggle = memo(forwardRef<HTMLButtonElement, MenuExpandToggleProps>(({
	controls,
	checked,
	disabled,
	onChange,
}, ref) => {
	const componentClassName = useComponentClassName('menu-expand-toggle')

	return <button
		tabIndex={-1}
		ref={ref}
		type="button"
		disabled={disabled}
		className={classNames(
			componentClassName,
			toStateClass('collapsed', !checked),
		)}
		aria-haspopup="true"
		aria-controls={controls}
		aria-expanded={checked}
		onClick={useCallback(() => {
			onChange(!checked)
		}, [checked, onChange])}
		onKeyPress={useCallback<KeyboardEventHandler>(event => {
			switch (event.code) {
				case 'ArrowRight': onChange(true)
					break
				case 'ArrowLeft': onChange(false)
					break
			}
		}, [onChange])}
	>
		<span className={`${componentClassName}-label`}>{checked ? '-' : '+'}</span>
	</button>
}))
