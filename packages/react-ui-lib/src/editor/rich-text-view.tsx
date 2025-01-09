import { Component, FieldView, SugaredRelativeSingleField } from '@contember/interface'
import { RichTextFieldRenderer, RichTextFieldRendererProps } from '@contember/react-client'

export type RichTextRendererProps =
	& {
		field: SugaredRelativeSingleField['field']
	}
	& Omit<RichTextFieldRendererProps, 'source'>

export const RichTextView = Component<RichTextRendererProps>(({ field, ...props }) => {
	return <FieldView<string> field={field} render={it => {
		if (!it.value) {
			return null
		}
		return <RichTextFieldRenderer source={JSON.parse(it.value)} {...props} />
	}} />
})
