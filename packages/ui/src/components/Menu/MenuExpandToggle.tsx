import { useClassNameFactory } from '@contember/react-utils'
import { KeyboardEventHandler, forwardRef, memo, useCallback } from 'react'
import { useInterfaceConfig } from '../../config'
import { toStateClass } from '../../utils'

interface MenuExpandToggleProps {
	controls: string
	disabled: boolean
	checked: boolean
	label?: string
	onChange: (checked: boolean) => void
}

export const MenuExpandToggle = memo(forwardRef<HTMLButtonElement, MenuExpandToggleProps>(({
	controls,
	checked,
	disabled,
	label,
	onChange,
}, ref) => {
	const componentClassName = useClassNameFactory('menu-expand-toggle')
	const { MenuExpandToggle } = useInterfaceConfig()

	return <button
		tabIndex={-1}
		ref={ref}
		type="button"
		disabled={disabled}
		className={componentClassName(null, [
			toStateClass('collapsed', !checked),
		])}
		aria-label={label}
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
		<MenuExpandToggle.Icon />
	</button>
}))
