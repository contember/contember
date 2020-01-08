import { Box, Button, FormGroup } from '@contember/ui'
import { assertNever } from '@contember/utils'
import * as React from 'react'
import Dropzone from 'react-dropzone'
import { useDispatch, useSelector } from 'react-redux'
import { uploadFile } from '../../../actions/upload'
import {
	Component,
	Field,
	FieldAccessor,
	useEnvironment,
	useMutationState,
	useRelativeSingleField,
} from '@contember/binding'
import State from '../../../state'
import UploadState, { AnyUpload, UploadStatus } from '../../../state/upload'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'

export interface UploadFieldMetadata {
	accessor: FieldAccessor<string>
	upload?: AnyUpload
	emptyText?: React.ReactNode
}

export type UploadFieldProps = SimpleRelativeSingleFieldProps & {
	accept?: string
	children: (url: string) => React.ReactNode
	emptyText?: React.ReactNode
}

export const UploadField = Component<UploadFieldProps>(
	props => {
		const [uploadId, setUploadId] = React.useState<undefined | string>(undefined)
		const uploads = useSelector<State, UploadState['uploads']>(state => state.upload.uploads)
		const dispatch = useDispatch()
		const environment = useEnvironment()
		const isMutating = useMutationState()
		const upload = uploadId ? uploads[uploadId] : undefined

		const accessor = useRelativeSingleField<string>(props)

		const handleStartUpload = React.useCallback(
			async (files: File[]) => {
				const uploadId = Math.random()
					.toString(36)
					.substring(2, 15)
				setUploadId(uploadId)
				dispatch(uploadFile(uploadId, files[0]))
			},
			[dispatch],
		)
		const metadata: UploadFieldMetadata = React.useMemo(
			() => ({
				emptyText: props.emptyText,
				upload,
				accessor,
			}),
			[accessor, props.emptyText, upload],
		)

		return (
			<FormGroup
				label={environment.applySystemMiddleware('labelMiddleware', props.label)}
				labelDescription={props.labelDescription}
				labelPosition={props.labelPosition}
				description={props.description}
				errors={accessor.errors}
			>
				<Dropzone disabled={isMutating} onDrop={handleStartUpload} accept={props.accept} multiple={false} style={{}}>
					<Inner metadata={metadata} {...props}>
						{props.children}
					</Inner>
				</Dropzone>
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
	const { upload, accessor, emptyText } = props.metadata
	React.useEffect(() => {
		if (upload && upload.status === UploadStatus.FINISHED && upload.resultUrl !== accessor.currentValue) {
			accessor.updateValue?.(upload.resultUrl)
		}
	}, [upload, accessor])
	const renderPreview = () => {
		if (upload && upload.status !== UploadStatus.FINISHED && upload.objectURL) {
			return props.children(upload.objectURL)
		}
		if (accessor.currentValue) {
			return props.children(accessor.currentValue)
		}
		return <span className="fileInput-empty">{emptyText}</span>
	}
	const renderUploadStatusMessage = (upload?: AnyUpload) => {
		if (!upload) {
			return (
				<>
					<Button size="small">Select a file to upload</Button>
					<span className={'fileInput-drop'}>or drag & drop</span>
				</>
			)
		}
		switch (upload.status) {
			case UploadStatus.PREPARING:
				return `Starting upload of ${upload.name}`
			case UploadStatus.UPLOADING:
				return `Upload of ${upload.name}: ${upload.progress && upload.progress.toFixed()}%`
			case UploadStatus.FAILED:
				return `Upload failed: ${upload.reason}`
			case UploadStatus.FINISHED:
				return `Upload has finished successfully`
			default:
				assertNever(upload)
		}
	}
	return (
		<Box distinction="seamlessIfNested">
			<span className="fileInput">
				<span className="fileInput-preview">{renderPreview()}</span>
				<span className="fileInput-message">{renderUploadStatusMessage(props.metadata.upload)}</span>
			</span>
		</Box>
	)
})
