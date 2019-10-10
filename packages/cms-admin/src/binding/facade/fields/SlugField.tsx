import { FormGroup, TextInput } from '@contember/ui'
import slugify from '@sindresorhus/slugify'
import * as React from 'react'
import { useEntityContext, useRelativeSingleField } from '../../accessorRetrievers'
import { useMutationState } from '../../accessorTree'
import { RelativeSingleField } from '../../bindingTypes'
import { Component, useEnvironment } from '../../coreComponents'
import { Environment } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { SimpleRelativeSingleFieldProps } from '../auxiliary'
import { ConcealableField, ConcealableFieldProps } from '../ui'

export type SlugFieldProps = Pick<ConcealableFieldProps, 'buttonProps' | 'concealTimeout'> &
	SimpleRelativeSingleFieldProps & {
		drivenBy: RelativeSingleField
		format?: (currentValue: string, environment: Environment) => string
		unpersistedHardPrefix?: string
		persistedHardPrefix?: string
		concealTimeout?: number
	}

export const SlugField = Component<SlugFieldProps>(
	({ buttonProps, concealTimeout, format, unpersistedHardPrefix, persistedHardPrefix, drivenBy, ...props }) => {
		const [hasEditedSlug, setHasEditedSlug] = React.useState(false)
		const hostEntity = useEntityContext() // TODO this will fail for some QL uses
		const slugField = useRelativeSingleField<string>(props.name)
		const driverField = useRelativeSingleField<string>(drivenBy)
		const environment = useEnvironment()
		const isMutating = useMutationState()

		let slugValue = slugField.currentValue || ''

		if (!hasEditedSlug && !hostEntity.isPersisted()) {
			slugValue = slugify(driverField.currentValue || '')

			if (format) {
				slugValue = format(slugValue, environment)
			}
			if (persistedHardPrefix) {
				slugValue = `${persistedHardPrefix}${slugValue}`
			}
		}

		React.useEffect(() => {
			if (slugField.currentValue === slugValue || !slugField.updateValue) {
				return
			}
			slugField.updateValue(slugValue)
		}, [slugField, slugValue])

		const completePrefix = `${unpersistedHardPrefix || ''}${persistedHardPrefix || ''}`
		const presentedValue = `${unpersistedHardPrefix || ''}${slugValue}`

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
								hasEditedSlug || setHasEditedSlug(true)
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
	(props, environment) => (
		<>
			{QueryLanguage.wrapRelativeSingleField(props.name, environment)}
			{QueryLanguage.wrapRelativeSingleField(props.drivenBy, environment)}
			{props.label}
		</>
	),
	'SlugField',
)
