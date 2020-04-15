import { Component, Field, useEntityContext, useEnvironment, useMutationState } from '@contember/binding'
import { FileUploader } from '@contember/client'
import { useFileUpload } from '@contember/react-client'
import { Box, Button, FormGroup } from '@contember/ui'
import * as React from 'react'
import { useDropzone } from 'react-dropzone'
import { SimpleRelativeSingleFieldProps } from '../../auxiliary'
import { ResolvablePopulatorProps, resolvePopulators, useResolvedPopulators } from '../fileDataPopulators'
import { UploadedFilePreview, UploadedFilePreviewProps } from './UploadedFilePreview'

export type UploadFieldProps = {
	accept?: string
	renderFile?: () => React.ReactNode
	renderFilePreview?: (file: File, previewUrl: string) => React.ReactNode
	emptyText?: React.ReactNode
	uploader?: FileUploader
} & SimpleRelativeSingleFieldProps &
	ResolvablePopulatorProps

const staticFileId = 'file'
export const UploadField = Component<UploadFieldProps>(
	props => {
		const [uploadState, { startUpload }] = useFileUpload()
		const environment = useEnvironment()
		const entity = useEntityContext()
		const isMutating = useMutationState()

		const singleFileUploadState = uploadState.get(staticFileId)
		const normalizedStateArray = [singleFileUploadState]
		const populators = useResolvedPopulators(props)

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
		const previewProps: UploadedFilePreviewProps[] = normalizedStateArray.map(state => ({
			emptyText: props.emptyText,
			uploadState: state,
			batchUpdates: entity.batchUpdates,
			renderFile: props.renderFile,
			renderFilePreview: props.renderFilePreview,
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
					<Box distinction="seamlessIfNested">
						<span className="fileInput">
							<span className="fileInput-preview">
								{previewProps.map((item, i) => (
									<UploadedFilePreview {...item} key={i} />
								))}
							</span>
							<span className="fileInput-message">
								<Button size="small">Select a file to upload</Button>
								<span className="fileInput-drop">or drag & drop</span>
							</span>
						</span>
					</Box>
				</div>
			</FormGroup>
		)
	},
	(props, environment) => (
		<>
			<Field field={props.field} />

			{resolvePopulators(props).map((item, i) => (
				<React.Fragment key={i}>{item.getStaticFields(environment)}</React.Fragment>
			))}
		</>
	),
	'UploadField',
)
