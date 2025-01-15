import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import * as React from 'react'
import { cn, uic } from '../utils'
import { toggleConfig, ToggleProps } from './toggle'

const ToggleGroupContext = React.createContext<ToggleProps>({
	size: 'default',
	variant: 'default',
})

const ToggleGroup = React.forwardRef<
	React.ElementRef<typeof ToggleGroupPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
	ToggleProps
>(({ className, variant, size, children, ...props }, ref) => (
	<ToggleGroupPrimitive.Root
		ref={ref}
		className={cn('flex items-center justify-center gap-1', className)}
		{...props}
	>
		<ToggleGroupContext.Provider value={{ variant, size }}>
			{children}
		</ToggleGroupContext.Provider>
	</ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItemInner = uic(ToggleGroupPrimitive.Item, toggleConfig)

const ToggleGroupItem = React.forwardRef<
	React.ElementRef<typeof ToggleGroupPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
	ToggleProps
>(({ className, children, variant, size, ...props }, ref) => {
	const context = React.useContext(ToggleGroupContext)

	return <ToggleGroupItemInner ref={ref} className={className} variant={context.variant || variant} size={context.size || size} {...props}>{children}</ToggleGroupItemInner>
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
