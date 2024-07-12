import { uic, uiconfig } from '../utils'

export const inputConfig = uiconfig({
	baseClass: 'flex w-full border bg-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none  disabled:cursor-not-allowed disabled:opacity-50 data-[invalid]:border-destructive data-[invalid]:ring-destructive read-only:bg-gray-100',
	variants: {
		variant: {
			default: 'border border-input ring-offset-background focus-visible:ring-2 focus-visible:ring-ring',
			ghost: 'border-none focus-visible:ring-transparent',
		},
		inputSize: {
			default: 'h-10 rounded-md p-2 text-sm',
			sm: 'h-8 rounded p-1 text-sm',
			lg: 'h-12 rounded-lg p-3 text-lg',
		},
	},
	defaultVariants: {
		variant: 'default',
		inputSize: 'default',
	},
})

export const Input = uic('input', {
	...inputConfig,
	displayName: 'Input',
})

export const Select = uic('select', {
	baseClass: 'flex w-full h-10 rounded-md p-2 text-sm border border-input bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[invalid]:border-destructive data-[invalid]:ring-destructive',
	displayName: 'Select',
})

export const InputLike = uic('div', {
	baseClass: `
		flex items-center min-h-10 w-full rounded-md border border-input bg-background p-2 text-sm ring-offset-background max-w-md
		file:border-0 file:bg-transparent file:text-sm file:font-medium
		placeholder:text-muted-foreground
		focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
		disabled:cursor-not-allowed
		disabled:opacity-50
		`,
	displayName: 'InputLike',
})

/**
 * without any styling, without ring, border etc; so it must be resetted
 */
export const InputBare = uic('input', {
	baseClass: 'w-full h-full focus-visible:outline-none',
	displayName: 'InputBare',
})


export const CheckboxInput = uic('input', {
	baseClass: 'w-4 h-4',
})

export const RadioInput = uic('input', {
	baseClass: `
		appearance-none bg-white rounded-full w-4 h-4 ring-1 ring-gray-400 hover:ring-gray-600 grid place-items-center
		before:rounded-full before:bg-gray-600 before:w-2 before:h-2 before:ring-2 before:ring-white before:content-[''] before:transform  before:transition-all before:scale-0 checked:before:scale-100
	`,
})
