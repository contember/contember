import {
	Component,
	EntityAccessor,
	Field,
	FieldAccessor,
	useEntityContext,
	useEnvironment,
	useMutationState,
	useRelativeSingleField,
} from '@contember/binding'
import { FileUploadReadyState, SingleFileUploadState, useFileUpload } from '@contember/react-client'
import { Box, Button, FormGroup } from '@contember/ui'
import { assertNever } from '@contember/utils'
import * as React from 'react'
import { useDropzone } from 'react-dropzone'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'
import {
	AggregateUploadProps,
	getAggregateFileMetadataFieldsPopulator,
	useDesugaredAggregateUploadProps,
} from '../upload'

export interface UploadFieldMetadata {
	accessor: FieldAccessor<string>
	uploadState: SingleFileUploadState | undefined
	emptyText?: React.ReactNode
}

export type UploadFieldProps = {
	accept?: string
	children: (url: string) => React.ReactNode
	emptyText?: React.ReactNode
} & SimpleRelativeSingleFieldProps &
	AggregateUploadProps

export const UploadField = Component<UploadFieldProps>(
	props => {
		const [uploadState, { startUpload }] = useFileUpload()
		const environment = useEnvironment()
		const entity = useEntityContext()
		const isMutating = useMutationState()
		const accessor = useRelativeSingleField<string>(props)
		const aggregateUploadProps = useDesugaredAggregateUploadProps(props)
		const entityRef = React.useRef<EntityAccessor>(entity)

		entityRef.current = entity

		const stateArray = Array.from(uploadState)
		const singleFileUploadState = stateArray.length ? stateArray[stateArray.length - 1][1] : undefined
		const onDrop = React.useCallback(
			([file]: File[]) => {
				startUpload([file])
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
				uploadState: singleFileUploadState,
				accessor,
			}),
			[accessor, props.emptyText, singleFileUploadState],
		)
		let file: File | undefined = undefined
		let previewUrl: string | undefined = undefined

		if (singleFileUploadState) {
			file = singleFileUploadState.file
			previewUrl = singleFileUploadState.previewUrl
		}

		React.useEffect(() => {
			let isMounted = true
			const createPopulator = async () => {
				if (previewUrl && file) {
					const populate = await getAggregateFileMetadataFieldsPopulator(file, previewUrl, aggregateUploadProps)
					if (isMounted) {
						populate(entityRef.current)
					}
				}
			}
			createPopulator()
			return () => {
				isMounted = false
			}
		}, [aggregateUploadProps, file, previewUrl])

		return (
			<FormGroup
				label={environment.applySystemMiddleware('labelMiddleware', props.label)}
				labelDescription={props.labelDescription}
				labelPosition={props.labelPosition}
				description={props.description}
				errors={accessor.errors}
				// Hotfix double browser window prompt. Apparently it's meant to be fixed already
				// (https://github.com/react-dropzone/react-dropzone/issues/182) but it appears that their fix relies on the
				// label being *inside* dropzone which, however, would ruin our margins. This will have to do for now.
				useLabelElement={false}
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
	props => (
		<>
			<Field field={props.field} />

			{props.sizeField && <Field field={props.sizeField} isNonbearing />}
			{props.typeField && <Field field={props.typeField} isNonbearing />}
			{props.fileNameField && <Field field={props.fileNameField} isNonbearing />}
			{props.lastModifiedField && <Field field={props.lastModifiedField} isNonbearing />}

			{props.widthField && <Field field={props.widthField} isNonbearing />}
			{props.heightField && <Field field={props.heightField} isNonbearing />}

			{props.durationField && <Field field={props.durationField} isNonbearing />}
		</>
	),
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
			uploadState.result.fileUrl !== accessor.currentValue
		) {
			accessor.updateValue?.(uploadState.result.fileUrl)
		}
	}, [uploadState, accessor])

	const renderPreview = () => {
		if (uploadState) {
			return props.children(uploadState.previewUrl)
		}
		if (accessor.currentValue) {
			return props.children(accessor.currentValue)
		}
		return <span className="fileInput-empty">{emptyText}</span>
	}
	const renderUploadStatusMessage = (uploadState?: SingleFileUploadState) => {
		if (!uploadState) {
			return (
				<>
					<Button size="small">Select a file to upload</Button>
					<span className={'fileInput-drop'}>or drag & drop</span>
				</>
			)
		}
		switch (uploadState.readyState) {
			case FileUploadReadyState.Uploading:
				if (uploadState.progress === undefined) {
					return `Starting upload`
				}
				return `Upload progress: ${(uploadState.progress * 100).toFixed()}%`
			case FileUploadReadyState.Aborted:
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
