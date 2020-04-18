import { useMutationState } from '@contember/binding'
import { useFileUpload } from '@contember/react-client'
import { Box, Button } from '@contember/ui'
import * as React from 'react'
import { useDropzone } from 'react-dropzone'
import { EmptyMessage } from '../../collections/helpers'
import { RepeaterContainerProps } from '../../collections/Repeater'
import { SingleFileUploadProps, UploadConfigProps } from '../core'
import { CustomDataPopulatorProps } from '../fileDataPopulators'
import { CustomFileKindProps } from './CustomFileKindProps'

export type FileRepeaterContainerPrivateProps = CustomDataPopulatorProps & CustomFileKindProps

export type FileRepeaterContainerPublicProps = UploadConfigProps & SingleFileUploadProps

export type FileRepeaterContainerProps = FileRepeaterContainerPublicProps &
	FileRepeaterContainerPrivateProps &
	Omit<RepeaterContainerProps, 'children'> & {
		children?: React.ReactNode
	}

export const FileRepeaterContainer = React.memo(
	({
		accept = '*',
		addButtonComponent: AddButton = Button,
		addButtonComponentExtraProps,
		addButtonProps,
		addButtonText = 'Select files to upload',
		addNew,
		children,
		fileDataPopulators,
		fileKinds,
		hasPersistedFile,
		renderFile,
		renderFilePreview,
		uploader,
		emptyMessage = 'No files uploaded.',
		emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
		emptyMessageComponentExtraProps,
		enableAddingNew = true,
		entityList,
		isEmpty,
		label,
	}: FileRepeaterContainerProps) => {
		const [uploadState, { startUpload, abortUpload }] = useFileUpload()
		const isMutating = useMutationState()
		const batchUpdates = entityList.batchUpdates

		const onDrop = React.useCallback(
			(files: File[]) => {
				batchUpdates(getAccessor => {
					//for (const file of files) {
					//	getAccessor().addNew
					//}
					//const fileById: [string, File] = [staticFileId, file]
					startUpload(files, {
						uploader,
					})
				})
			},
			[batchUpdates, startUpload, uploader],
		)
		const { getRootProps, getInputProps, isDragActive } = useDropzone({
			onDrop,
			disabled: isMutating && !enableAddingNew,
			accept: accept,
			multiple: true,
			noKeyboard: true, // This would normally be absolutely henious but there is a keyboard-focusable button inside.
		})

		return (
			<Box isActive={isDragActive} heading={label}>
				<div {...getRootProps()}>
					{enableAddingNew || <input {...getInputProps()} />}
					{isEmpty && (
						<EmptyMessageComponent {...emptyMessageComponentExtraProps}>{emptyMessage}</EmptyMessageComponent>
					)}
					{!isEmpty && children}
					{enableAddingNew && (
						<label>
							<input {...getInputProps()} />
							<AddButton size="small" {...addButtonComponentExtraProps} children={addButtonText} {...addButtonProps} />
							<span className="fileInput-drop">or drag & drop</span>
						</label>
					)}
				</div>
			</Box>
		)
	},
)
FileRepeaterContainer.displayName = 'FileRepeaterContainer'
