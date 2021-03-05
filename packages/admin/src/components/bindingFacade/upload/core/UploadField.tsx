import {
	BindingError,
	Component,
	EntityAccessor,
	Environment,
	useEntity,
	useEnvironment,
	useField,
	useMutationState,
} from '@contember/binding'
import { useFileUpload } from '@contember/react-client'
import { Button, FileDropZone, FormGroup, FormGroupProps } from '@contember/ui'
import { Fragment, FunctionComponent, ReactNode, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
	FileUrlDataPopulator,
	ResolvablePopulatorProps,
	resolvePopulators,
	useResolvedPopulators,
} from '../fileDataPopulators'
import { SingleFileUploadProps } from './SingleFileUploadProps'
import { UploadConfigProps } from './UploadConfigProps'
import { UploadedFilePreview } from './UploadedFilePreview'
import { UploadingFilePreview } from './UploadingFilePreview'

export type UploadFieldRenderingProps = {
	uploadButtonText?: ReactNode
	uploadButtonSubText?: ReactNode
}

export type UploadFieldProps = UploadConfigProps &
	SingleFileUploadProps &
	Omit<FormGroupProps, 'children'> &
	ResolvablePopulatorProps &
	UploadFieldRenderingProps & {
		hasPersistedFile?: (entity: EntityAccessor, environment: Environment) => boolean
	}

const staticFileId = 'file'
export const UploadField: FunctionComponent<UploadFieldProps> = Component(
	props => {
		const { uploadButtonText = 'Select a file to upload', uploadButtonSubText = 'or drag & drop' } = props

		const [uploadState, { startUpload }] = useFileUpload({
			maxUpdateFrequency: 100,
		})
		const environment = useEnvironment()
		const entity = useEntity()
		const isMutating = useMutationState()

		const singleFileUploadState = uploadState.get(staticFileId)
		const populators = useResolvedPopulators(props)

		if (__DEV_MODE__) {
			if ('imageFileUrlField' in props || 'audioFileUrlField' in props || 'videoFileUrlField' in props) {
				throw new BindingError(`UploadField: specify the file url only using the fileUrlField prop.`)
			}
		}

		// We're giving the FileUrlDataPopulator special treatment here since it's going to be by far the most used one.
		// Other populators pay the price of an additional hook which isn't that big of a deal.
		const fileUrlField = useField(
			populators.find(populator => populator instanceof FileUrlDataPopulator) && 'fileUrlField' in props
				? props.fileUrlField
				: undefined,
		)
		const hasPersistedFile = props.hasPersistedFile || (fileUrlField ? () => fileUrlField.value !== null : undefined)

		const onDrop = useCallback(
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

		const shouldDisplayPreview =
			!!singleFileUploadState || (hasPersistedFile ? hasPersistedFile(entity, environment) : true)

		// This doesn't actually work well: the urlField could be something like 'mainFile.url' where the 'url' field is
		// non-nullable. We cannot easily detect from here what exactly to set to null, remove or disconnect.

		// const clearField = useMemo<undefined | MouseEventHandler>(() => {
		// 	return fileUrlField && fileUrlField.value !== null
		// 		? e => {
		// 				e.stopPropagation()
		// 				fileUrlField.updateValue(null)
		// 		  }
		// 		: undefined
		// }, [fileUrlField])
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
					<div className="fileInput">
						{shouldDisplayPreview && (
							<div className="fileInput-preview">
								{singleFileUploadState ? (
									<UploadingFilePreview
										uploadState={singleFileUploadState}
										batchUpdates={entity.batchUpdates}
										renderFilePreview={props.renderFilePreview}
										environment={environment}
										populators={populators}
									/>
								) : (
									<UploadedFilePreview renderFile={props.renderFile} />
									// <ActionableBox onRemove={clearField}>
									// <UploadedFilePreview renderFile={props.renderFile} />
									// </ActionableBox>
								)}
							</div>
						)}
						<FileDropZone isActive={isDragActive} className="fileInput-dropZone">
							<div className="fileInput-cta">
								<Button size="small">{uploadButtonText}</Button>
								<span className="fileInput-cta-label">{uploadButtonSubText}</span>
							</div>
						</FileDropZone>
					</div>
				</div>
			</FormGroup>
		)
	},
	(props, environment) => (
		<>
			{resolvePopulators(props).map((item, i) => (
				<Fragment key={i}>{item.getStaticFields(environment)}</Fragment>
			))}
			{props.renderFile?.()}
		</>
	),
	'UploadField',
)
