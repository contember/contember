import { useOptionalDesugaredRelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { DesugaredGenericFileUploadProps, GenericFileUploadProps } from './GenericFileUploadProps'

export const useDesugaredGenericFileUploadProps = (props: GenericFileUploadProps): DesugaredGenericFileUploadProps => {
	const fileNameField = useOptionalDesugaredRelativeSingleField(props.fileNameField)
	const lastModifiedField = useOptionalDesugaredRelativeSingleField(props.lastModifiedField)
	const sizeField = useOptionalDesugaredRelativeSingleField(props.sizeField)
	const typeField = useOptionalDesugaredRelativeSingleField(props.typeField)

	return React.useMemo(
		() => ({
			fileNameField,
			lastModifiedField,
			sizeField,
			typeField,
		}),
		[fileNameField, lastModifiedField, sizeField, typeField],
	)
}
