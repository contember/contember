import { Button, FieldContainer, FieldContainerProps, FieldErrors, FileDropZone, Stack } from '@contember/ui'
import { ReactNode } from 'react'
import type { DropzoneState } from 'react-dropzone'
import type { MessageFormatter } from '../../../../i18n'
import type { AddEntityButtonProps } from '../../collections'
import type { UploadDictionary } from '../uploadDictionary'
import { SelectFileInput, SelectFileInputProps, SelectFileInputPublicProps } from './selection/SelectFileInput'

export type FileInputPublicProps =
	& Pick<FieldContainerProps, 'label' | 'description' | 'labelDescription'>
	& AddEntityButtonProps
	& SelectFileInputPublicProps
	&	{
		enableAddingNew?: boolean
		addButtonSubText?: ReactNode
	}

export type FileInputProps =
	& FileInputPublicProps
	& SelectFileInputProps<{}>
	&	{
		children: ReactNode
		dropzoneState: DropzoneState
		errors: FieldErrors | undefined
		formatMessage: MessageFormatter<UploadDictionary>
	}

export const FileInput = ({
	addButtonComponent: AddButton = Button,
	addButtonComponentExtraProps,
	addButtonProps,
	addButtonSubText,
	addButtonText,
	children,
	description,
	dropzoneState,
	enableAddingNew = true,
	errors,
	formatMessage,
	label,
	labelDescription,
	...selectProps
}: FileInputProps) => {
	const { getRootProps, isDragActive, isDragAccept, isDragReject, getInputProps } = dropzoneState

	return (
		<FieldContainer
			label={label}
			useLabelElement={false}
			description={description}
			labelDescription={labelDescription}
			errors={errors}
		>
			<div className="fileInput">
				{children !== undefined && children}
				{enableAddingNew && (
					<FileDropZone
						{...getRootProps()}
						isActive={isDragActive}
						isAccepting={isDragAccept}
						isRejecting={isDragReject}
						className="fileInput-dropZone"
					>
						<input {...getInputProps()} />
						<div className="fileInput-cta">
							<Stack wrap justify="center" direction="horizontal">
								{selectProps.fileSelection && (
									<SelectFileInput {...selectProps} formatMessage={formatMessage} />
								)}
								<AddButton
									size="small"
									{...addButtonComponentExtraProps}
									{...addButtonProps}
								>
									{formatMessage(addButtonText, 'upload.addButton.text')}
								</AddButton>
							</Stack>
							<span className="fileInput-cta-label">
								{formatMessage(addButtonSubText, 'upload.addButton.subText')}
							</span>
						</div>
					</FileDropZone>
				)}
			</div>
		</FieldContainer>
	)
}
