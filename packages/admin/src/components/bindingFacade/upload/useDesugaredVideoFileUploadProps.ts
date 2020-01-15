import { useOptionalDesugaredRelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { DesugaredVideoFileUploadProps, VideoFileUploadProps } from './VideoFileUploadProps'

export const useDesugaredVideoFileUploadProps = (props: VideoFileUploadProps): DesugaredVideoFileUploadProps => {
	const durationField = useOptionalDesugaredRelativeSingleField(props.durationField)
	const heightField = useOptionalDesugaredRelativeSingleField(props.heightField)
	const widthField = useOptionalDesugaredRelativeSingleField(props.widthField)

	return React.useMemo(
		() => ({
			durationField,
			heightField,
			widthField,
		}),
		[durationField, heightField, widthField],
	)
}
