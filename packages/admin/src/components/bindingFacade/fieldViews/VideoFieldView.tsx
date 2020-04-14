import {
	Component,
	FieldValue,
	SugaredField,
	SugaredFieldProps,
	useOptionalRelativeSingleField,
	useRelativeSingleField,
} from '@contember/binding'
import * as React from 'react'

export interface VideoFieldViewProps<SrcField extends FieldValue = string>
	extends Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
	srcField: SugaredFieldProps['field']
	titleField?: SugaredFieldProps['field']
	formatUrl?: (srcFieldValue: SrcField) => string
	fallback?: React.ReactNode
}

export const VideoFieldView = Component(
	<SrcField extends FieldValue = string>({
		srcField,
		titleField,
		formatUrl,
		fallback,
		...videoProps
	}: VideoFieldViewProps<SrcField>) => {
		const srcAccessor = useRelativeSingleField<SrcField>(srcField)
		const titleAccessor = useOptionalRelativeSingleField<string>(titleField)

		if (!srcAccessor.currentValue) {
			return <>{fallback}</>
		}
		return (
			// The spread intentionally comes after alt and title so that it's possible to provide just static string values.
			<video
				src={formatUrl ? formatUrl(srcAccessor.currentValue) : (srcAccessor.currentValue as string)}
				title={titleAccessor?.currentValue || undefined}
				controls
				{...videoProps}
			/>
		)
	},
	({ srcField, titleField }) => (
		<>
			<SugaredField field={srcField} />
			{titleField && <SugaredField field={titleField} />}
		</>
	),
	'VideoFieldView',
) as <SrcField extends FieldValue = string>(props: VideoFieldViewProps<SrcField>) => React.ReactElement
