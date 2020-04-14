import {
	Component,
	EntityAccessor,
	Environment,
	Field,
	useEntityContext,
	useEnvironment,
	useMutationState,
	useRelativeSingleField,
} from '@contember/binding'
import { FileUploader } from '@contember/client'
import { FileUploadReadyState, SingleFileUploadState, useFileUpload } from '@contember/react-client'
import { Box, Button, FormGroup } from '@contember/ui'
import * as React from 'react'
import { useDropzone } from 'react-dropzone'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'
import {
	AggregateDataPopulatorProps,
	AudioFileMetadataPopulator,
	FileDataPopulator,
	FileUrlDataPopulator,
	GenericFileMetadataPopulator,
	ImageFileMetadataPopulator,
	VideoFileMetadataPopulator,
} from '../upload'

export interface UploadFieldMetadata {
	entityAccessor: EntityAccessor
	environment: Environment
	uploadState: SingleFileUploadState | undefined
	emptyText?: React.ReactNode
	populators: FileDataPopulator[]
}

export type UploadFieldProps = {
	accept?: string
	children: (url: string) => React.ReactNode
	emptyText?: React.ReactNode
	uploader?: FileUploader
} & SimpleRelativeSingleFieldProps &
	({ fileDataPopulators: Iterable<FileDataPopulator> } | AggregateDataPopulatorProps)

const createPopulatorsFromProps = (props: UploadFieldProps): FileDataPopulator[] => {
	if ('fileDataPopulators' in props) {
		return Array.from(props.fileDataPopulators)
	}
	return [
		new AudioFileMetadataPopulator(props),
		new FileUrlDataPopulator(props),
		new GenericFileMetadataPopulator(props),
		new ImageFileMetadataPopulator(props),
		new VideoFileMetadataPopulator(props),
	]
}

const staticFileId = 'file'
export const UploadField = Component<UploadFieldProps>(
	props => {
		const [uploadState, { startUpload }] = useFileUpload()
		const environment = useEnvironment()
		const entity = useEntityContext()
		const isMutating = useMutationState()

		const singleFileUploadState = uploadState.get(staticFileId)
		const normalizedStateArray = [singleFileUploadState]

		const populators = React.useMemo<FileDataPopulator[]>(() => createPopulatorsFromProps(props), [props])

		const onDrop = React.useCallback(
			([file]: File[]) => {
				const fileById: [string, File] = [staticFileId, file]
				startUpload([fileById], {
					uploader: props.uploader,
				})
			},
			[props.uploader, startUpload],
		)
		const { getRootProps, getInputProps, isDragActive } = useDropzone({
			onDrop,
			disabled: isMutating,
			accept: props.accept,
			multiple: false,
			noKeyboard: true, // This would normally be absolutely henious but there is a keyboard-focusable button inside.
		})
		const metadata: UploadFieldMetadata[] = normalizedStateArray.map(state => ({
			emptyText: props.emptyText,
			uploadState: state,
			entityAccessor: entity,
			environment,
			populators,
		}))

		return (
			<FormGroup
				label={environment.applySystemMiddleware('labelMiddleware', props.label)}
				labelDescription={props.labelDescription}
				labelPosition={props.labelPosition}
				description={props.description}
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
					{metadata.map((metadata, i) => (
						<Inner metadata={metadata} {...props} key={i}>
							{props.children}
						</Inner>
					))}
				</div>
			</FormGroup>
		)
	},
	(props, environment) => (
		<>
			<Field field={props.field} />

			{createPopulatorsFromProps(props).map((item, i) => (
				<React.Fragment key={i}>{item.getStaticFields(environment)}</React.Fragment>
			))}
		</>
	),
	'UploadField',
)

type InnerProps = SimpleRelativeSingleFieldProps & {
	metadata: UploadFieldMetadata
	emptyText?: React.ReactNode
	children: (url: string) => React.ReactNode
}

type PopulatorDataState =
	| {
			name: 'uninitialized'
			data?: never
	  }
	| {
			name: 'ready'
			data: any[]
	  }
	| {
			name: 'error'
			data?: never
	  }

const Inner = React.memo((props: InnerProps) => {
	const { uploadState, emptyText, entityAccessor, environment, populators } = props.metadata

	const temporaryDesugaredField = useRelativeSingleField<string>(props)

	const uploadStateRef = React.useRef(uploadState)
	const [preparedPopulatorData, setPreparedPopulatorData] = React.useState<PopulatorDataState>({
		name: 'uninitialized',
	})
	const uploadedFile = uploadState?.file
	const readyState = uploadState?.readyState
	const batchUpdates = entityAccessor.batchUpdates

	const relevantPopulators = React.useMemo(
		() => (uploadedFile ? populators.filter(populator => populator.canHandleFile(uploadedFile)) : []),
		[populators, uploadedFile],
	)

	React.useEffect(() => {
		uploadStateRef.current = uploadState
	}, [uploadState])

	React.useEffect(() => {
		let isMounted = true

		const currentUploadState = uploadStateRef.current
		if (readyState === FileUploadReadyState.Uploading && currentUploadState) {
			const dataPromises = relevantPopulators.map(populator =>
				populator.prepareFileData
					? populator.prepareFileData(currentUploadState.file, currentUploadState.previewUrl)
					: Promise.resolve(undefined),
			)
			setPreparedPopulatorData({ name: 'uninitialized' })
			Promise.all(dataPromises).then(data => {
				if (!isMounted) {
					return
				}
				setPreparedPopulatorData({
					name: 'ready',
					data,
				})
			})
		}

		return () => {
			isMounted = false
		}
	}, [readyState, relevantPopulators])

	React.useEffect(() => {
		if (
			uploadState?.readyState !== FileUploadReadyState.Success ||
			preparedPopulatorData.name !== 'ready' ||
			!batchUpdates
		) {
			return
		}

		for (let i = 0; i < relevantPopulators.length; i++) {
			const populator = relevantPopulators[i]
			const preparedData = preparedPopulatorData.data[i]

			populator.populateFileData(
				{
					uploadResult: uploadState.result,
					file: uploadState.file,
					previewUrl: uploadState.previewUrl,
					environment,
					batchUpdates,
				},
				preparedData,
			)
		}
	}, [
		batchUpdates,
		environment,
		preparedPopulatorData.data,
		preparedPopulatorData.name,
		relevantPopulators,
		uploadState,
	])

	const renderPreview = () => {
		if (uploadState) {
			return props.children(uploadState.previewUrl)
		}
		if (temporaryDesugaredField.currentValue) {
			return props.children(temporaryDesugaredField.currentValue)
		}
		return <span className="fileInput-empty">{emptyText}</span>
	}
	const renderUploadStatusMessage = (uploadState?: SingleFileUploadState) => {
		console.log('us', uploadState, preparedPopulatorData)
		if (!uploadState || uploadState.readyState === FileUploadReadyState.Aborted) {
			return (
				<>
					<Button size="small">Select a file to upload</Button>
					<span className={'fileInput-drop'}>or drag & drop</span>
				</>
			)
		}
		if (uploadState.readyState === FileUploadReadyState.Error || preparedPopulatorData.name === 'error') {
			return `Upload failed`
		}
		if (uploadState.readyState === FileUploadReadyState.Success && preparedPopulatorData.name === 'ready') {
			return `Upload has finished successfully`
		}
		if (uploadState.readyState === FileUploadReadyState.Uploading && uploadState.progress !== undefined) {
			return `Upload progress: ${(uploadState.progress * 100).toFixed()}%`
		}
		return `Uploading…`
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
