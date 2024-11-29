import { useAutoHeightTextArea, useComposeRef } from '@contember/react-utils'
import { uic } from '../utils'
import { ComponentProps, forwardRef, useRef } from 'react'

export const Textarea = uic('textarea', {
	baseClass: `
		w-full bg-background rounded-md border border-input px-3 py-2 text-sm shadow-sm 
		placeholder:text-muted-foreground 
		focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring 
		disabled:cursor-not-allowed disabled:opacity-50
		read-only:bg-gray-100
		` /*data-[dirty]:border-yellow-500 focus-visible:data-[dirty]:border-input*/ + `
		data-[invalid]:border-destructive data-[invalid]:ring-destructive
	`,
	displayName: 'Textarea',
})

export const TextareaAutosize = forwardRef<HTMLTextAreaElement, ComponentProps<typeof Textarea> & {
	minRows?: number
	maxRows?: number
}>(({ minRows, maxRows, ...props }, ref) => {
	const innerRef = useRef<HTMLTextAreaElement | null>(null)
	useAutoHeightTextArea(innerRef, props.value?.toString() ?? '', minRows ?? 3, maxRows ?? 100)

	return <Textarea ref={useComposeRef(innerRef, ref)} {...props} />
})
