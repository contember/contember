import { Button, FileDropZone, FormGroup, FormGroupProps } from '@contember/ui'
import type { ReactNode } from 'react'
import type { DropzoneState } from 'react-dropzone'
import { EmptyMessage } from '../../collections'
import type { RepeaterContainerPublicProps } from '../../collections'

export interface FileInputPublicProps
	extends RepeaterContainerPublicProps,
		Pick<FormGroupProps, 'description' | 'labelDescription'> {
	addButtonSubText?: ReactNode
}

export interface FileInputProps extends FileInputPublicProps {
	dropzoneState: DropzoneState
	label: ReactNode
	children: ReactNode
}

export function FileInput({
	dropzoneState,

	label,
	description,
	labelDescription,
	children,
	enableAddingNew,

	addButtonComponent: AddButton = Button,
	addButtonComponentExtraProps,
	addButtonProps,
	addButtonText = 'Select files to upload',
	addButtonSubText = 'or drag & drop',
	emptyMessage,
	emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
	emptyMessageComponentExtraProps,
}: FileInputProps) {
	const { getRootProps, isDragActive, getInputProps } = dropzoneState

	return (
		<FormGroup label={label} useLabelElement={false} description={description} labelDescription={labelDescription}>
			<div className="fileInput">
				{children === undefined && (
					<EmptyMessageComponent {...emptyMessageComponentExtraProps}>
						{emptyMessage ?? 'No files uploaded.'}
					</EmptyMessageComponent>
				)}
				{children !== undefined && children}
				{enableAddingNew && (
					<FileDropZone {...getRootProps()} isActive={isDragActive} className="fileInput-dropZone">
						<input {...getInputProps()} />
						<div className="fileInput-cta">
							<AddButton size="small" {...addButtonComponentExtraProps} children={addButtonText} {...addButtonProps} />
							{addButtonSubText && <span className="fileInput-cta-label">{addButtonSubText}</span>}
						</div>
					</FileDropZone>
				)}
			</div>
		</FormGroup>
	)
}
