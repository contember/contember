import * as ProgressPrimitive from '@radix-ui/react-progress'
import * as React from 'react'
import { uic } from '../utils'

const ProgressRoot = uic(ProgressPrimitive.Root, {
	baseClass: 'relative h-1.5 w-full overflow-hidden rounded-full bg-primary/20',
	displayName: ProgressPrimitive.Root.displayName,
})

const ProgressIndicator = uic(ProgressPrimitive.Indicator, {
	baseClass: 'h-full w-full flex-1 transition-all bg-gradient-to-b from-blue-500 to-blue-400',
	displayName: ProgressPrimitive.Indicator.displayName,
})

export const Progress = React.forwardRef<
	React.ElementRef<typeof ProgressPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
	<ProgressRoot ref={ref} {...props}>
		<ProgressIndicator style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
	</ProgressRoot>
))
Progress.displayName = ProgressPrimitive.Root.displayName
