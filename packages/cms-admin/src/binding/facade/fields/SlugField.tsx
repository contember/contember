import { Button, FormGroup, TextInput } from '@contember/ui'
import slugify from '@sindresorhus/slugify'
import * as React from 'react'
import { RelativeSingleField } from '../../bindingTypes'
import { Field, useEnvironment } from '../../coreComponents'
import { useMutationState } from '../../coreComponents/PersistState'
import { Environment } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { Component, SimpleRelativeSingleFieldProps } from '../auxiliary'
import { useRelativeSingleField } from '../utils'

export type SlugFieldProps = SimpleRelativeSingleFieldProps & {
	drivenBy: RelativeSingleField
	format?: (currentValue: string, environment: Environment) => string
}

export const SlugField = Component<SlugFieldProps>(
	props => <SlugFieldInner {...props} />,
	(props, environment) => (
		<>
			{QueryLanguage.wrapRelativeSingleField(
				props.name,
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

interface SlugFieldInnerProps extends SlugFieldProps {}

const SlugFieldInner = ({ format, drivenBy, ...props }: SlugFieldInnerProps) => {
	const [hasEditedSlug, setHasEditedSlug] = React.useState(false)
	const slugField = useRelativeSingleField<string>(props.name)
	const driverField = useRelativeSingleField<string>(drivenBy)
	const environment = useEnvironment()
	const isMutating = useMutationState()
	const [isEditing, setIsEditing] = React.useState(false)
	const inputRef = React.useRef<HTMLInputElement>()

	React.useLayoutEffect(() => {
		if (isEditing && inputRef.current) {
			inputRef.current.focus()
		}
	}, [isEditing])

	// TODO maybe be smarter when the field is already persisted?
	let slugValue = slugField.currentValue || ''

	if (!hasEditedSlug) {
		slugValue = slugify(driverField.currentValue || '')

		if (format) {
			slugValue = format(slugValue, environment)
		}
	}

	if (!isEditing) {
		return (
			<div
				className="slugField"
				onClick={() => {
					setIsEditing(true)
				}}
			>
				<div className="slugField-value">{slugValue}</div>
				<Button size="small" distinction="seamless" className="slugField-button">
					Edit
				</Button>
			</div>
		)
	}

	return (
		<FormGroup
			label={props.label ? environment.applySystemMiddleware('labelMiddleware', props.label) : undefined}
			errors={slugField.errors}
			labelDescription={props.labelDescription}
			labelPosition={props.labelPosition}
			description={props.description}
			size="small"
		>
			<TextInput
				value={slugValue}
				onChange={newValue => {
					hasEditedSlug || setHasEditedSlug(true)
					slugField.updateValue && slugField.updateValue(newValue)
				}}
				readOnly={isMutating}
				validationState={slugField.errors.length ? 'invalid' : undefined}
				size="small"
				ref={inputRef}
				{...props}
			/>
		</FormGroup>
	)
}
