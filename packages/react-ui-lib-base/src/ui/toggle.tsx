import { composeEventHandlers } from '@contember/utilities'
import { Slot } from '@radix-ui/react-slot'
import { ComponentPropsWithoutRef, forwardRef, useState } from 'react'
import { ConfigVariants, uic, uiconfig } from '../utils/index.js'

export const toggleConfig = uiconfig({
	baseClass:
		'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent data-[active]:shadow-inner data-[active]:text-accent-foreground',
	variants: {
		variant: {
			default: 'bg-transparent',
			outline: 'border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground',
		},
		size: {
			default: 'h-8 px-3',
			sm: 'h-8 px-2',
			lg: 'h-10 px-3',
		},
	},
	defaultVariants: {
		variant: 'default',
		size: 'default',
	},
})

export type ToggleProps = ConfigVariants<Exclude<typeof toggleConfig.variants, undefined>>

type ToggleBaseProps = ComponentPropsWithoutRef<'button'> & {
	/** Controlled pressed state. */
	pressed?: boolean
	defaultPressed?: boolean
	onPressedChange?: (pressed: boolean) => void
	asChild?: boolean
}

const ToggleBase = forwardRef<HTMLButtonElement, ToggleBaseProps>(
	({ asChild, pressed: pressedProp, defaultPressed, onPressedChange, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button'
		const [uncontrolledPressed, setUncontrolledPressed] = useState(defaultPressed ?? false)
		const isControlled = pressedProp !== undefined
		const pressed = isControlled ? pressedProp : uncontrolledPressed
		return (
			<Comp
				type="button"
				aria-pressed={pressed}
				data-state={pressed ? 'on' : 'off'}
				data-disabled={props.disabled ? '' : undefined}
				{...props}
				ref={ref}
				onClick={composeEventHandlers(props.onClick, () => {
					if (props.disabled) {
						return
					}
					if (!isControlled) {
						setUncontrolledPressed(!pressed)
					}
					onPressedChange?.(!pressed)
				})}
			/>
		)
	},
)
ToggleBase.displayName = 'Toggle'

export const Toggle = uic(ToggleBase, toggleConfig)
