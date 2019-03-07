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
import { EnforceSubtypeRelation, Field, FieldMetadata, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment, FieldAccessor } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'

export interface UploadFieldMetadata extends FieldMetadata<string> {
	upload?: AnyUpload
}

export interface UploadFieldOwnProps {
	name: FieldName
	label?: FormGroupProps['label']
	children?: (metadata: UploadFieldMetadata) => React.ReactNode
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

interface UploadFieldProps extends UploadFieldOwnProps, UploadFieldDispatchProps, UploadFieldStateProps {}

class UploadFieldComponent extends React.Component<UploadFieldProps, UploadFieldState> {
	static displayName = 'UploadField'

	state: UploadFieldState = {}

	private handleStartUpload = async (files: File[]) => {
		const uploadId = Math.random()
			.toString(36)
			.substring(2, 15)
		this.setState({ uploadId })
		this.props.onUpload(uploadId, files[0])
	}

	public render() {
		const upload = this.state.uploadId ? this.props.uploads[this.state.uploadId] : undefined

		return (
			<Field<string> name={this.props.name}>
				{(metadata): React.ReactNode => (
					<Dropzone onDrop={this.handleStartUpload} accept="image/*" multiple={false} style={{}}>
						<UploadFieldComponent.Inner
							metadata={{
								...metadata,
								upload
							}}
							label={this.props.label}
						>
							{this.props.children}
						</UploadFieldComponent.Inner>
					</Dropzone>
				)}
			</Field>
		)
	}

	public static generateSyntheticChildren(props: UploadFieldOwnProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

namespace UploadFieldComponent {
	export interface InnerProps {
		metadata: UploadFieldMetadata
		label?: FormGroupProps['label']
		children?: (metadata: UploadFieldMetadata) => React.ReactNode
	}

	export class Inner extends React.PureComponent<InnerProps> {
		public render() {
			const { environment, data, upload } = this.props.metadata

			return (
				<FormGroup label={environment.applySystemMiddleware('labelMiddleware', this.props.label)}>
					<label className="fileInput">
						{data.currentValue && this.isImage(data.currentValue) ? (
							<img src={data.currentValue} style={{ width: '15%' }} />
						) : null}
						{upload && upload.status !== UploadStatus.FINISHED && upload.objectURL ? (
							<img
								src={upload.objectURL}
								style={{
									width: '15%'
								}}
							/>
						) : null}
						<span className="fileInput-label" style={{ marginLeft: '10px' }}>
							{this.renderUploadStatusMessage(upload)}
						</span>
					</label>
				</FormGroup>
			)
		}

		public componentDidUpdate() {
			const { upload, data } = this.props.metadata

			if (upload && upload.status === UploadStatus.FINISHED && upload.resultUrl !== data.currentValue) {
				data.onChange && data.onChange(upload.resultUrl)
			}
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
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof UploadFieldComponent,
	SyntheticChildrenProvider<UploadFieldOwnProps>
>

export const UploadField = connect<UploadFieldStateProps, UploadFieldDispatchProps, UploadFieldOwnProps, State>(
	state => ({
		uploads: state.upload.uploads
	}),
	(dispatch: Dispatch) => ({
		onUpload: (id, file) => dispatch(uploadFile(id, file))
	})
)(UploadFieldComponent)
