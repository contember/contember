import { Component, FieldProps, FieldView } from '@contember/interface'

export type EnumListFieldProps =
	& FieldProps
	& {
		options: Record<string, string>
		separator?: string
	}

export const EnumListField = Component<EnumListFieldProps>(({ options, separator = ', ', ...props }) => {
	return (
		<FieldView<string[]> {...props} render={it => {
			return it.value?.map((value) => (
				options[value]
			)).join(separator) ?? null
		}} />
	)
})
