import {
	Component,
	Environment,
	Field,
	SugaredRelativeSingleField,
	useDerivedField,
	useEnvironment,
} from '@contember/binding'
import { ControlProps, SlugInput } from '@contember/ui'
import slugify from '@sindresorhus/slugify'
import { useCallback, useMemo } from 'react'
import type { SimpleRelativeSingleFieldProps } from '../auxiliary'
import { SimpleRelativeSingleField } from '../auxiliary'
import { useFieldControl } from './useFieldControl'

export type SlugPrefix = string | ((environment: Environment) => string)

export type SlugFieldProps =
	& SimpleRelativeSingleFieldProps
	& ControlProps<string>
	& {
		derivedFrom: SugaredRelativeSingleField['field']
		unpersistedHardPrefix?: SlugPrefix
		persistedHardPrefix?: SlugPrefix
		persistedSoftPrefix?: SlugPrefix
		linkToExternalUrl?: boolean
	}

const useNormalizedPrefix = (value?: SlugPrefix) => {
	const environment = useEnvironment()
	return useMemo(() => typeof value === 'function' ? value(environment) : value ?? '', [value, environment])
}

/**
 * @group Form Fields
 */
export const SlugField = Component<SlugFieldProps>(
	props => <SlugFieldInner {...props} />,
	props => <>
		<Field field={props.derivedFrom} />
		<SlugFieldInner {...props} />
	</>,
)

export const SlugFieldInner = SimpleRelativeSingleField<SlugFieldProps, string>(
	(fieldMetadata, {
		unpersistedHardPrefix,
		persistedHardPrefix,
		persistedSoftPrefix,
		linkToExternalUrl,
		derivedFrom,
		field,
		...props
	}) => {
		const normalizedUnpersistedHardPrefix = useNormalizedPrefix(unpersistedHardPrefix)
		const normalizedPersistedHardPrefix = useNormalizedPrefix(persistedHardPrefix)
		const normalizedPersistedSoftPrefix = useNormalizedPrefix(persistedSoftPrefix)

		const inputProps = useFieldControl<string, string>({
			...props,
			fieldMetadata,
			parse: (val, field) => {
				const parsedValue = val ?? null
				return parsedValue !== null ? `${normalizedPersistedHardPrefix}${parsedValue}` : null
			},
			format: value => typeof value === 'string' ? value.substring(normalizedPersistedHardPrefix.length) : '',
		})
		const transform = useCallback(
			(driverFieldValue: string | null) => {
				if (driverFieldValue === null) {
					return null
				}

				const slugValue = slugify(driverFieldValue)

				return `${normalizedPersistedHardPrefix}${normalizedPersistedSoftPrefix}${slugValue}`
			},
			[normalizedPersistedHardPrefix, normalizedPersistedSoftPrefix],
		)
		useDerivedField<string>(derivedFrom, field, transform)

		const hardPrefix = normalizedUnpersistedHardPrefix + normalizedPersistedHardPrefix
		const fullValue = hardPrefix + inputProps.value

		return (
			<SlugInput
				{...inputProps}
				prefix={hardPrefix}
				link={linkToExternalUrl ? fullValue : undefined}
			/>
		)
	},
	'SlugField',
)
