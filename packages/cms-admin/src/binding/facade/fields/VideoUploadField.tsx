import * as React from 'react'
import { FormGroupProps } from '../../../components/ui'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { UploadField } from './UploadField'

export interface VideoUploadFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
}

export class VideoUploadField extends React.PureComponent<VideoUploadFieldProps> {
	static displayName = 'VideoUploadField'

	public render() {
		return (
			<UploadField name={this.props.name} accept="video/*">
				{url => <video src={url} controls />}
			</UploadField>
		)
	}

	public static generateSyntheticChildren(props: VideoUploadFieldProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof VideoUploadField,
	SyntheticChildrenProvider<VideoUploadFieldProps>
>
