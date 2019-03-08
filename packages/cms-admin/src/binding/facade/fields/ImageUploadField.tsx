import * as React from 'react'
import { FormGroupProps } from '../../../components/ui'
import { FieldName } from '../../bindingTypes'
import { EnforceSubtypeRelation, Field, SyntheticChildrenProvider } from '../../coreComponents'
import { Environment } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { UploadField } from './UploadField'

export interface ImageUploadFieldProps {
	name: FieldName
	label?: FormGroupProps['label']
}

export class ImageUploadField extends React.PureComponent<ImageUploadFieldProps> {
	static displayName = 'ImageUploadField'

	public render() {
		return (
			<UploadField name={this.props.name} accept="image/*">
				{url => <img src={url} />}
			</UploadField>
		)
	}

	public static generateSyntheticChildren(props: ImageUploadFieldProps, environment: Environment): React.ReactNode {
		return QueryLanguage.wrapRelativeSingleField(props.name, fieldName => <Field name={fieldName} />, environment)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<
	typeof ImageUploadField,
	SyntheticChildrenProvider<ImageUploadFieldProps>
>
