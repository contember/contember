import {
	Component,
	Environment,
	Field,
	SugaredRelativeSingleField,
	useDrivenField,
	useEnvironment,
	useMutationState,
	useRelativeSingleField,
} from '@contember/binding'
import { FormGroup, TextInput } from '@contember/ui'
import slugify from '@sindresorhus/slugify'
import * as React from 'react'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'
import { ConcealableField, ConcealableFieldProps } from '../ui'

export type SlugFieldProps = Pick<ConcealableFieldProps, 'buttonProps' | 'concealTimeout'> &
	SimpleRelativeSingleFieldProps & {
		drivenBy: SugaredRelativeSingleField['field']
		format?: (currentValue: string, environment: Environment) => string
		unpersistedHardPrefix?: string
		persistedHardPrefix?: string
		concealTimeout?: number
	}

export const SlugField = Component<SlugFieldProps>(
	({ buttonProps, concealTimeout, format, unpersistedHardPrefix, persistedHardPrefix, drivenBy, field, ...props }) => {
		const environment = useEnvironment()
		const transform = React.useCallback(
			(driverFieldValue: string | null) => {
				let slugValue = slugify(driverFieldValue || '')

				if (format) {
					slugValue = format(slugValue, environment)
				}
				if (persistedHardPrefix) {
					slugValue = `${persistedHardPrefix}${slugValue}`
				}
				return slugValue
			},
			[environment, format, persistedHardPrefix],
		)
		useDrivenField<string>(drivenBy, field, transform)

		const slugField = useRelativeSingleField<string>(field)
		const isMutating = useMutationState()

		const completePrefix = `${unpersistedHardPrefix || ''}${persistedHardPrefix || ''}`
		const presentedValue = `${unpersistedHardPrefix || ''}${slugField.currentValue || ''}`

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
								if (slugField.updateValue) {
									const rawValue = e.target.value
									const unprefixedValue = rawValue.substring(completePrefix.length)
									slugField.updateValue(`${persistedHardPrefix || ''}${unprefixedValue}`)
								}
							}}
							readOnly={isMutating}
							validationState={slugField.errors.length ? 'invalid' : undefined}
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
			<Field field={props.drivenBy} />
			{props.label}
		</>
	),
	'SlugField',
)
