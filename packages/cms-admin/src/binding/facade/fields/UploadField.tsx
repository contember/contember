import { assertNever } from 'cms-common'
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
import { Environment } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'

export interface UploadFieldMetadata extends FieldMetadata<string> {
	upload?: AnyUpload
	label?: FormGroupProps['label']
	emptyText?: React.ReactNode
}

export interface UploadFieldOwnProps {
	name: FieldName
	label?: FormGroupProps['label']
	accept: string
	children: (url: string) => React.ReactNode
	emptyText?: React.ReactNode
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
					<Dropzone
						disabled={metadata.isMutating}
						onDrop={this.handleStartUpload}
						accept={this.props.accept}
						multiple={false}
						style={{}}
					>
						<UploadFieldComponent.Inner
							metadata={{
								...metadata,
								upload,
								label: this.props.label,
								emptyText: this.props.emptyText,
							}}
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
		emptyText?: React.ReactNode
		children: (url: string) => React.ReactNode
	}

	export class Inner extends React.PureComponent<InnerProps> {
		public render() {
			const { environment, upload, label, errors } = this.props.metadata
			return (
				<FormGroup label={environment.applySystemMiddleware('labelMiddleware', label)} errors={errors}>
					<label className="fileInput">
						<span className="fileInput-preview">{this.renderPreview()}</span>
						<span className="fileInput-message">{this.renderUploadStatusMessage(upload)}</span>
					</label>
				</FormGroup>
			)
		}

		private renderPreview() {
			const { data, upload, emptyText } = this.props.metadata
			if (upload && upload.status !== UploadStatus.FINISHED && upload.objectURL) {
				return this.props.children(upload.objectURL)
			}
			if (data.currentValue) {
				return this.props.children(data.currentValue)
			}
			return <span className="fileInput-empty">{emptyText}</span>
		}

		public componentDidUpdate() {
			const { upload, data } = this.props.metadata

			if (upload && upload.status === UploadStatus.FINISHED && upload.resultUrl !== data.currentValue) {
				data.updateValue && data.updateValue(upload.resultUrl)
			}
		}

		private renderUploadStatusMessage(upload?: AnyUpload) {
			if (!upload) {
				return (
					<>
						<button className={'button'}>Select a file to upload</button>
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
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof UploadFieldComponent,
	SyntheticChildrenProvider<UploadFieldOwnProps>
>

export const UploadField = connect<UploadFieldStateProps, UploadFieldDispatchProps, UploadFieldOwnProps, State>(
	state => ({
		uploads: state.upload.uploads,
	}),
	(dispatch: Dispatch) => ({
		onUpload: (id, file) => dispatch(uploadFile(id, file)),
	}),
)(UploadFieldComponent)
