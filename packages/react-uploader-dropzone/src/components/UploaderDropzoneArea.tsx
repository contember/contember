import * as React from 'react'
import { ReactNode, useMemo } from 'react'
import { useUploaderDropzoneState } from '../internal/contexts'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'
import { useUploaderState } from '@contember/react-uploader'

export const UploaderDropzoneArea = ({ children }: {
	children: ReactNode
}) => {
	const { getRootProps, isDragActive, isDragAccept, isDragReject, isFocused, isFileDialogActive } = useUploaderDropzoneState()
	const files = useUploaderState()
	const isUploading = useMemo(() => files.some(it => it.state === 'uploading' || it.state === 'initial'), [files])
	return (
		<Slot
			{...getRootProps()}
			data-dropzone-active={dataAttribute(isDragActive)}
			data-dropzone-accept={dataAttribute(isDragAccept)}
			data-dropzone-reject={dataAttribute(isDragReject)}
			data-dropzone-focused={dataAttribute(isFocused)}
			data-dropzone-file-dialog-active={dataAttribute(isFileDialogActive)}
			data-dropzone-uploading={dataAttribute(isUploading)}
		>
			{children}
		</Slot>
	)
}
