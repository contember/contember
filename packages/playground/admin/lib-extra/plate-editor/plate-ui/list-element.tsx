import { uic } from '@app/lib/utils'
import { PlateElement } from '@udecode/plate-common'

export const ListElement = uic(PlateElement, {
	baseClass: 'm-0 ps-6',
	variants: {
		variant: {
			ul: 'list-disc [&_ul]:list-[circle] [&_ul_ul]:list-[square]',
			ol: 'list-decimal',
		},
	},
	defaultVariants: {
		variant: 'ul',
	},
	wrapOuter: props => {
		const Component = props.variant!

		return <Component>{props.children}</Component>
	},
})
