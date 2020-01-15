import { useOptionalDesugaredRelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { DesugaredImageFileUploadProps, ImageFileUploadProps } from './ImageFileUploadProps'

export const useDesugaredImageFileUploadProps = (props: ImageFileUploadProps): DesugaredImageFileUploadProps => {
	const heightField = useOptionalDesugaredRelativeSingleField(props.heightField)
	const widthField = useOptionalDesugaredRelativeSingleField(props.widthField)

	return React.useMemo(
		() => ({
			heightField,
			widthField,
		}),
		[heightField, widthField],
	)
}
