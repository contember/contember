import * as React from 'react'
import slugify from '@sindresorhus/slugify'
import { FormGroup, InputGroup } from '../../../components/ui'
import { RelativeSingleField } from '../../bindingTypes'
import { Field, useEnvironment } from '../../coreComponents'
import { useMutationState } from '../../coreComponents/PersistState'
import { QueryLanguage } from '../../queryLanguage'
import { Component } from '../auxiliary'
import { useRelativeSingleField } from '../utils'

export interface SlugProps {
	field: RelativeSingleField
	drivenBy: RelativeSingleField
	label?: React.ReactNode
	prefix?: string
}

export const Slug = Component<SlugProps>(
	props => <SlugInner {...props} />,
	(props, environment) => (
		<>
			{QueryLanguage.wrapRelativeSingleField(
				props.field,
				fieldName => (
					<Field name={fieldName} />
				),
				environment,
			)}
			{QueryLanguage.wrapRelativeSingleField(
				props.drivenBy,
				fieldName => (
					<Field name={fieldName} />
				),
				environment,
			)}
			{props.label}
		</>
	),
	'Slug',
)

interface SlugInnerProps extends SlugProps {}

const SlugInner = (props: SlugInnerProps) => {
	const [hasEditedSlug, setHasEditedSlug] = React.useState(false)
	const slugField = useRelativeSingleField<string>(props.field)
	const driverField = useRelativeSingleField<string>(props.drivenBy)
	const environment = useEnvironment()
	const isMutating = useMutationState()

	// TODO maybe be smarter when the field is already persisted?
	const slugValue = hasEditedSlug
		? slugField.currentValue || ''
		: `${props.prefix || ''}${slugify(driverField.currentValue || '')}`

	return (
		<FormGroup
			label={props.label ? environment.applySystemMiddleware('labelMiddleware', props.label) : undefined}
			errors={slugField.errors}
		>
			<InputGroup
				value={slugValue}
				onChange={event => {
					hasEditedSlug || setHasEditedSlug(true)
					slugField.updateValue && slugField.updateValue(event.currentTarget.value)
				}}
				readOnly={isMutating}
			/>
		</FormGroup>
	)
}
