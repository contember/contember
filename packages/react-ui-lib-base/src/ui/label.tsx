import { Slot } from '@radix-ui/react-slot'
import { ComponentPropsWithoutRef, forwardRef } from 'react'
import { uic } from '../utils/index.js'

const LabelBase = forwardRef<HTMLLabelElement, ComponentPropsWithoutRef<'label'> & { asChild?: boolean }>(({ asChild, ...props }, ref) => {
	const Comp = asChild ? Slot : 'label'
	return (
		<Comp
			{...props}
			ref={ref}
			onMouseDown={event => {
				// Clicks on a nested control keep their default; otherwise a double click must not select the label text.
				if (event.target instanceof Element && event.target.closest('button, input, select, textarea')) {
					return
				}
				props.onMouseDown?.(event)
				if (!event.defaultPrevented && event.detail > 1) {
					event.preventDefault()
				}
			}}
		/>
	)
})
LabelBase.displayName = 'Label'

export const Label = uic(LabelBase, {
	baseClass: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[invalid]:text-destructive',
	displayName: 'Label',
})
