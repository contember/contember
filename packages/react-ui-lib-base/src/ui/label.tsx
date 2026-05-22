import * as LabelPrimitive from '@radix-ui/react-label'
import { uic } from '../utils'

export const Label = uic(LabelPrimitive.Root, {
	baseClass: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[invalid]:text-destructive',
	displayName: 'Label',
})
