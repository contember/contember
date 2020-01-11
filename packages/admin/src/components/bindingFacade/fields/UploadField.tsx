import { FileUploadReadyState, FileUploadState, useFileUpload } from '@contember/react-client'
import { Box, Button, FormGroup } from '@contember/ui'
import { assertNever } from '@contember/utils'
import * as React from 'react'
import { useDropzone } from 'react-dropzone'
import {
	Component,
	Field,
	FieldAccessor,
	useEnvironment,
	useMutationState,
	useRelativeSingleField,
} from '@contember/binding'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'

export interface UploadFieldMetadata {
	accessor: FieldAccessor<string>
	uploadState: FileUploadState | undefined
	emptyText?: React.ReactNode
}

export type UploadFieldProps = SimpleRelativeSingleFieldProps & {
	accept?: string
	children: (url: string) => React.ReactNode
	emptyText?: React.ReactNode
}

export const UploadField = Component<UploadFieldProps>(
	props => {
		const [uploadState, { startUpload }] = useFileUpload()
		const environment = useEnvironment()
		const isMutating = useMutationState()
		const accessor = useRelativeSingleField<string>(props)

		const onDrop = React.useCallback(
			async (files: File[]) => {
				startUpload([
					{
						id: 0,
						file: files[0],
					},
				])
			},
			[startUpload],
		)
		const { getRootProps, getInputProps, isDragActive } = useDropzone({
			onDrop,
			disabled: isMutating,
			accept: props.accept,
			multiple: false,
			noKeyboard: true, // This would normally be absolutely henious but there is a keyboard-focusable button inside.
		})
		const metadata: UploadFieldMetadata = React.useMemo(
			() => ({
				emptyText: props.emptyText,
				uploadState: uploadState[0],
				accessor,
			}),
			[accessor, props.emptyText, uploadState],
		)

		return (
			<FormGroup
				label={environment.applySystemMiddleware('labelMiddleware', props.label)}
				labelDescription={props.labelDescription}
				labelPosition={props.labelPosition}
				description={props.description}
				errors={accessor.errors}
			>
				<div
					{...getRootProps({
						style: {},
					})}
				>
					<input {...getInputProps()} />
					<Inner metadata={metadata} {...props}>
						{props.children}
					</Inner>
				</div>
			</FormGroup>
		)
	},
	props => <Field field={props.field} />,
	'UploadField',
)

type InnerProps = SimpleRelativeSingleFieldProps & {
	metadata: UploadFieldMetadata
	emptyText?: React.ReactNode
	children: (url: string) => React.ReactNode
}

const Inner = React.memo((props: InnerProps) => {
	const { uploadState, accessor, emptyText } = props.metadata
	React.useEffect(() => {
		if (
			uploadState &&
			uploadState.readyState === FileUploadReadyState.Success &&
			uploadState.fileUrl !== accessor.currentValue
		) {
			accessor.updateValue?.(uploadState.fileUrl)
		}
	}, [uploadState, accessor])

	const renderPreview = () => {
		if (uploadState && uploadState.readyState !== FileUploadReadyState.Uninitialized && uploadState.previewUrl) {
			return props.children(uploadState.previewUrl)
		}
		if (accessor.currentValue) {
			return props.children(accessor.currentValue)
		}
		return <span className="fileInput-empty">{emptyText}</span>
	}
	const renderUploadStatusMessage = (uploadState?: FileUploadState) => {
		if (!uploadState || uploadState.readyState === FileUploadReadyState.Uninitialized) {
			return (
				<>
					<Button size="small">Select a file to upload</Button>
					<span className={'fileInput-drop'}>or drag & drop</span>
				</>
			)
		}
		switch (uploadState.readyState) {
			case FileUploadReadyState.Initializing:
				return `Starting upload`
			case FileUploadReadyState.Uploading:
				return `Upload progress: ${(uploadState.progress * 100).toFixed()}%`
			case FileUploadReadyState.Error:
				return `Upload failed`
			case FileUploadReadyState.Success:
				return `Upload has finished successfully`
			default:
				assertNever(uploadState)
		}
	}
	return (
		<Box distinction="seamlessIfNested">
			<span className="fileInput">
				<span className="fileInput-preview">{renderPreview()}</span>
				<span className="fileInput-message">{renderUploadStatusMessage(props.metadata.uploadState)}</span>
			</span>
		</Box>
	)
})
