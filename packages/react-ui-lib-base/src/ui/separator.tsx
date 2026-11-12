import { Slot } from '@radix-ui/react-slot'
import { ComponentPropsWithoutRef, forwardRef } from 'react'
import { uic } from '../utils/index.js'

type SeparatorBaseProps = ComponentPropsWithoutRef<'div'> & {
	orientation?: 'horizontal' | 'vertical'
	/** A purely visual separator, hidden from assistive technology. */
	decorative?: boolean
	asChild?: boolean
}

const SeparatorBase = forwardRef<HTMLDivElement, SeparatorBaseProps>(({ asChild, decorative, orientation: orientationProp, ...props }, ref) => {
	const Comp = asChild ? Slot : 'div'
	const orientation = orientationProp === 'vertical' ? 'vertical' : 'horizontal'
	return (
		<Comp
			data-orientation={orientation}
			role={decorative ? 'none' : 'separator'}
			aria-orientation={!decorative && orientation === 'vertical' ? orientation : undefined}
			{...props}
			ref={ref}
		/>
	)
})
SeparatorBase.displayName = 'Separator'

export const Separator = uic(SeparatorBase, {
	baseClass: 'shrink-0 bg-border',
	variants: {
		orientation: {
			horizontal: 'h-[1px] w-full',
			vertical: 'h-full w-[1px]',
		},
	},
	displayName: 'Separator',
})
