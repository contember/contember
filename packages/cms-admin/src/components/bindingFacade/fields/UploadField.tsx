import { Box, Button, FormGroup } from '@contember/ui'
import { assertNever } from '@contember/utils'
import * as React from 'react'
import Dropzone from 'react-dropzone'
import { connect } from 'react-redux'
import { Dispatch } from '../../../actions/types'
import { uploadFile } from '../../../actions/upload'
import {
	EnforceSubtypeRelation,
	Environment,
	Field,
	FieldMetadata,
	QueryLanguage,
	SyntheticChildrenProvider,
} from '../../../binding'
import State from '../../../state'
import { AnyUpload, UploadStatus } from '../../../state/upload'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'

export interface UploadFieldMetadata extends FieldMetadata<string> {
	upload?: AnyUpload
	emptyText?: React.ReactNode
}

export type UploadFieldOwnProps = SimpleRelativeSingleFieldProps & {
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
					<FormGroup
						label={metadata.environment.applySystemMiddleware('labelMiddleware', this.props.label)}
						labelDescription={this.props.labelDescription}
						labelPosition={this.props.labelPosition}
						description={this.props.description}
						errors={metadata.errors}
					>
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
									emptyText: this.props.emptyText,
								}}
								{...this.props}
							>
								{this.props.children}
							</UploadFieldComponent.Inner>
						</Dropzone>
					</FormGroup>
				)}
			</Field>
		)
	}

	public static generateSyntheticChildren(props: UploadFieldOwnProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(props.name, environment)
	}
}

namespace UploadFieldComponent {
	export type InnerProps = SimpleRelativeSingleFieldProps & {
		metadata: UploadFieldMetadata
		emptyText?: React.ReactNode
		children: (url: string) => React.ReactNode
	}

	export class Inner extends React.PureComponent<InnerProps> {
		public render() {
			return (
				<Box distinction="seamlessIfNested">
					<span className="fileInput">
						<span className="fileInput-preview">{this.renderPreview()}</span>
						<span className="fileInput-message">{this.renderUploadStatusMessage(this.props.metadata.upload)}</span>
					</span>
				</Box>
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
