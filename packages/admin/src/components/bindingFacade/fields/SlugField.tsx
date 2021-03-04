import {
	Component,
	Environment,
	Field,
	SugaredRelativeSingleField,
	useDerivedField,
	useEnvironment,
	useMutationState,
	useField,
} from '@contember/binding'
import { FormGroup, TextInput } from '@contember/ui'
import slugify from '@sindresorhus/slugify'
import * as React from 'react'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'
import { ConcealableField, ConcealableFieldProps } from '../ui'

export type SlugFieldProps = Pick<ConcealableFieldProps, 'buttonProps' | 'concealTimeout'> &
	SimpleRelativeSingleFieldProps & {
		derivedFrom: SugaredRelativeSingleField['field']
		unpersistedHardPrefix?: string | ((environment: Environment) => string)
		persistedHardPrefix?: string | ((environment: Environment) => string)
		persistedSoftPrefix?: string | ((environment: Environment) => string)
		concealTimeout?: number
	}

export const SlugField: React.FunctionComponent<SlugFieldProps> = Component(
	({
		buttonProps,
		concealTimeout,
		unpersistedHardPrefix,
		persistedHardPrefix,
		persistedSoftPrefix,
		derivedFrom,
		field,
		...props
	}) => {
		const environment = useEnvironment()
		const {
			normalizedUnpersistedHardPrefix,
			normalizedPersistedHardPrefix,
			normalizedPersistedSoftPrefix,
		} = React.useMemo(
			() => ({
				normalizedUnpersistedHardPrefix:
					typeof unpersistedHardPrefix === 'function'
						? unpersistedHardPrefix(environment)
						: unpersistedHardPrefix || '',
				normalizedPersistedHardPrefix:
					typeof persistedHardPrefix === 'function' ? persistedHardPrefix(environment) : persistedHardPrefix || '',
				normalizedPersistedSoftPrefix:
					typeof persistedSoftPrefix === 'function' ? persistedSoftPrefix(environment) : persistedSoftPrefix || '',
			}),
			[environment, persistedHardPrefix, persistedSoftPrefix, unpersistedHardPrefix],
		)
		const transform = React.useCallback(
			(driverFieldValue: string | null) => {
				const slugValue = slugify(driverFieldValue || '')

				return `${normalizedPersistedHardPrefix}${normalizedPersistedSoftPrefix}${slugValue}`
			},
			[normalizedPersistedHardPrefix, normalizedPersistedSoftPrefix],
		)
		useDerivedField<string>(derivedFrom, field, transform)

		const slugField = useField<string>(field)
		const isMutating = useMutationState()

		const completeHardPrefix = `${normalizedUnpersistedHardPrefix}${normalizedPersistedHardPrefix}`
		const presentedValue = `${normalizedUnpersistedHardPrefix}${slugField.value || ''}`

		return (
			<ConcealableField
				renderConcealedValue={() => presentedValue}
				buttonProps={buttonProps}
				concealTimeout={concealTimeout}
			>
				{({ inputRef, onFocus, onBlur }) => (
					<FormGroup
						label={props.label ? environment.applySystemMiddleware('labelMiddleware', props.label) : undefined}
						errors={slugField.errors}
						labelDescription={props.labelDescription}
						labelPosition={props.labelPosition || 'labelInlineLeft'}
						description={props.description}
						size="small"
					>
						<TextInput
							value={presentedValue}
							onChange={e => {
								const rawValue = e.target.value
								const valueWithoutHardPrefix = rawValue.substring(completeHardPrefix.length)
								slugField.updateValue(`${normalizedPersistedHardPrefix}${valueWithoutHardPrefix}`)
							}}
							readOnly={isMutating}
							validationState={slugField.errors ? 'invalid' : undefined}
							size="small"
							ref={inputRef}
							onFocus={onFocus}
							onBlur={onBlur}
							{...props}
						/>
					</FormGroup>
				)}
			</ConcealableField>
		)
	},
	props => (
		<>
			<Field field={props.field} defaultValue={props.defaultValue} />
			<Field field={props.derivedFrom} />
			{props.label}
		</>
	),
	'SlugField',
)
