import { assertNever } from 'cms-common'
import { contentType } from 'mime-types'
import * as React from 'react'
import Dropzone from 'react-dropzone'
import { connect } from 'react-redux'
import { Dispatch } from '../../../actions/types'
import { uploadFile } from '../../../actions/upload'
import { FormGroup, FormGroupProps } from '../../../components'
import State from '../../../state'
import { AnyUpload, UploadStatus } from '../../../state/upload'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'

export interface UploadFieldOwnProps {
	name: FieldName
	label?: FormGroupProps['label']
}

export interface UploadFieldDispatchProps {
	onUpload: (id: string, file: File) => void
}

export interface UploadFieldStateProps {
	uploads: { [id: string]: AnyUpload }
}

interface UploadFieldState {
	uploadId?: string
}

class UploadFieldComponent extends React.Component<
	UploadFieldOwnProps & UploadFieldDispatchProps & UploadFieldStateProps,
	UploadFieldState
> {
	static displayName = 'UploadField'

	state: UploadFieldState = {}

	handleStartUpload(files: File[]) {
		const uploadId = Math.random()
			.toString(36)
			.substring(2, 15)
		this.setState({ uploadId })
		this.props.onUpload(uploadId, files[0])
	}

	public render() {
		const upload: AnyUpload | undefined = this.state.uploadId ? this.props.uploads[this.state.uploadId] : undefined

		return (
			<Field<string> name={this.props.name}>
				{({ data, environment }): React.ReactNode => {
					if (upload && upload.status === UploadStatus.FINISHED && upload.resultUrl !== data.currentValue) {
						data.onChange && data.onChange(upload.resultUrl)
					}
					return (
						<FormGroup label={environment.applySystemMiddleware('labelMiddleware', this.props.label)}>
							<Dropzone
								onDrop={async (accepted: File[]) => {
									this.handleStartUpload(accepted)
								}}
								accept="image/*"
								multiple={false}
								style={{}}
							>
								<label className="fileInput">
									{data.currentValue && this.isImage(data.currentValue) ? (
										<img src={data.currentValue} style={{ width: '15%' }} />
									) : null}
									{upload && upload.status !== UploadStatus.FINISHED && upload.thumbnailUrl ? (
										<img
											src={upload.thumbnailUrl}
											style={{
												width: '15%'
											}}
										/>
									) : null}
									<span className="fileInput-label" style={{ marginLeft: '10px' }}>
										{this.renderUploadStatusMessage(upload)}
									</span>
								</label>
							</Dropzone>
						</FormGroup>
					)
				}}
			</Field>
		)
	}

	private isImage(filename: string): boolean {
		const contentTypeValue = contentType(filename.substring(filename.lastIndexOf('/') + 1))
		return contentTypeValue !== false && contentTypeValue.startsWith('image/')
	}

	private renderUploadStatusMessage(upload?: AnyUpload) {
		if (!upload) {
			return 'Select a file to upload'
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

	public static generateSyntheticChildren(props: UploadFieldOwnProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof UploadFieldComponent,
	SyntheticChildrenProvider<UploadFieldOwnProps>
>

const UploadField = connect<UploadFieldStateProps, UploadFieldDispatchProps, UploadFieldOwnProps, State>(
	state => ({
		uploads: state.upload.uploads
	}),
	(dispatch: Dispatch) => ({
		onUpload: (id, file) => dispatch(uploadFile(id, file))
	})
)(UploadFieldComponent)

export { UploadField }
