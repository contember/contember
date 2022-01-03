import {
	Component,
	Environment,
	Field,
	SugaredRelativeSingleField,
	useDerivedField,
	useEnvironment,
	useField,
	useMutationState,
} from '@contember/binding'
import { FormGroup, isSpecialLinkClick, TextInput } from '@contember/ui'
import slugify from '@sindresorhus/slugify'
import { FunctionComponent, useCallback, useMemo } from 'react'
import type { SimpleRelativeSingleFieldProps } from '../auxiliary'
import { ConcealableField, ConcealableFieldProps } from '../ui'

type SlugPrefix = string | ((environment: Environment) => string);
export type SlugFieldProps = Pick<ConcealableFieldProps, 'buttonProps' | 'concealTimeout'> &
	SimpleRelativeSingleFieldProps & {
		derivedFrom: SugaredRelativeSingleField['field']
		unpersistedHardPrefix?: SlugPrefix
		persistedHardPrefix?: SlugPrefix
		persistedSoftPrefix?: SlugPrefix
		concealTimeout?: number
		linkToExternalUrl?: boolean
	}

const useNormalizedPrefix = (value?: SlugPrefix) => {
	const environment = useEnvironment()
	return useMemo(() => typeof value === 'function' ? value(environment) : value ?? '', [value, environment])
}

export const SlugField: FunctionComponent<SlugFieldProps> = Component(
	({
		buttonProps,
		concealTimeout,
		unpersistedHardPrefix,
		persistedHardPrefix,
		persistedSoftPrefix,
		derivedFrom,
		field,
		linkToExternalUrl = false,
		...props
	}) => {
		const normalizedUnpersistedHardPrefix = useNormalizedPrefix(unpersistedHardPrefix)
		const normalizedPersistedHardPrefix = useNormalizedPrefix(persistedHardPrefix)
		const normalizedPersistedSoftPrefix = useNormalizedPrefix(persistedSoftPrefix)
		const environment = useEnvironment()
		const transform = useCallback(
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
				renderConcealedValue={() =>
					linkToExternalUrl ? (
						<a
							href={presentedValue}
							onClick={event => {
								if (isSpecialLinkClick(event.nativeEvent)) {
									event.stopPropagation()
								} else {
									event.preventDefault()
								}
							}}
						>
							{presentedValue}
						</a>
					) : (
						presentedValue
					)
				}
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
