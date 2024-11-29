import { uic } from '../utils/uic'
import { Label } from '../ui/label'

export const FormLayout = uic('div', {
	baseClass: 'flex flex-col gap-2 mx-4',
	displayName: 'FormLayout',
})

export const FormDescriptionUI = uic('p', {
	baseClass: 'text-[0.8rem] text-muted-foreground',
	displayName: 'FormDescription',
})

export const FormErrorUI = uic('p', {
	baseClass: 'text-[0.8rem] font-medium text-destructive',
	displayName: 'FormError',
})
export const FormLabelWrapperUI = uic('div', {
	baseClass: 'flex',
	displayName: 'FormLabelWrapper',
})
export const FormLabelUI = uic(Label, {
	baseClass: 'text-left data-[required]:after:text-destructive data-[required]:after:content-[attr(data-required-content)] after:ml-1',
	displayName: 'FormLabel',
	variants: {
		required: {
			true: 'after:text-destructive after:content-[attr(data-required-content)] after:ml-1',
			false: '',
		},
	},
	defaultProps: {
		['data-required-content']: '*',
	} as any,
})
export const FormContainerUI = uic('div', {
	baseClass: 'flex flex-col gap-2 w-full',
	displayName: 'FormContainer',
})
