import { uic } from '../../utils/uic'

export const Input = uic('input', {
	baseClass: 'flex w-full border border-input bg-background m ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[invalid]:border-destructive data-[invalid]:ring-destructive',
	variants: {
		inputSize: {
			default: 'h-10 rounded-md  p-2 text-sm',
			sm: 'h-8 rounded  p-1 text-sm',
		},
	},
	defaultVariants: {
		inputSize: 'default',
	},
	displayName: 'Input',
})


export const InputLike = uic('div', {
	baseClass: 'flex items-center min-h-10 w-full rounded-md border border-input bg-background p-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
	displayName: 'InputLike',
})

/**
 * without any styling, without ring, border etc; so it must be resetted
 */
export const InputBare = uic('input', {
	baseClass: 'w-full h-full focus-visible:outline-none',
	displayName: 'InputBare',
})
