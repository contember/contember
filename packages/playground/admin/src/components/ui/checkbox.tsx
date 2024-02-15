import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { cn } from '../../utils/cn'
import { CheckIcon, MinusIcon } from 'lucide-react'
import { uic } from '../../utils/uic'


export const Checkbox = uic(CheckboxPrimitive.Root, {
	baseClass: 'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground group',
	displayName: 'Checkbox',
	afterChildren: (
		<CheckboxPrimitive.Indicator
			className={cn('flex items-center justify-center text-current')}
		>
			<CheckIcon className="h-4 w-4 group-data-[state=indetermined]:hidden" />
			<MinusIcon className="h-4 w-4 group-data-[state=checked]:hidden" />
		</CheckboxPrimitive.Indicator>
	),
})
