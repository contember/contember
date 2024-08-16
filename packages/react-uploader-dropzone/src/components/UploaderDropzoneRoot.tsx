import * as React from 'react'
import { ReactNode } from 'react'
import { UploaderDropzoneStateContext } from '../internal/contexts'
import { useDropzone } from 'react-dropzone'
import { useMutationState } from '@contember/react-binding'
import { useUploaderOptions, useUploaderUploadFiles } from '@contember/react-uploader'

export const UploaderDropzoneRoot = ({ children, noInput }: {
	children: ReactNode
	noInput?: boolean
}) => {
	// const fileHandler = useUploaderFileHandler()
	const isMutating = useMutationState()
	const onDrop = useUploaderUploadFiles()
	const { multiple, accept } = useUploaderOptions()

	const dropzoneState = useDropzone({
		onDrop,
		disabled: isMutating,
		accept,
		multiple,
		noKeyboard: true, // This would normally be absolutely henious but there is a keyboard-focusable button inside.
	})

	return (
		<UploaderDropzoneStateContext.Provider value={dropzoneState}>
			{noInput ? null : (
				<input
					{...dropzoneState.getInputProps()}
				/>
			)}
			{children}
		</UploaderDropzoneStateContext.Provider>
	)
}
