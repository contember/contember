import { Environment, FieldAccessor, SugaredRelativeSingleField, useDesugaredRelativeSingleField, useEntity, useEnvironment, useField } from '@contember/react-binding'
import { FormInputHandler } from '@contember/react-form'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { SlugInputOwnProps } from './FormSlugInput'

export type SlugPrefix = string | ((environment: Environment) => string)

export type UseSlugValueProps =
	& SlugInputOwnProps
	& {
		field: SugaredRelativeSingleField['field']
	}

export const useSlugInput = ({
	field: fieldName,
	derivedFrom,
	format,
	unpersistedHardPrefix,
	persistedHardPrefix,
	persistedSoftPrefix,
	slugify,
}: UseSlugValueProps) => {

	const field = useField<string>(fieldName)
	const normalizedUnpersistedHardPrefix = useNormalizedPrefix(unpersistedHardPrefix)
	const normalizedPersistedHardPrefix = useNormalizedPrefix(persistedHardPrefix)
	const normalizedPersistedSoftPrefix = useNormalizedPrefix(persistedSoftPrefix)

	const derivedFromNormalized = useMemo(() => Array.isArray(derivedFrom) ? derivedFrom : [derivedFrom], [derivedFrom])

	const fieldRef = useRef(field)
	fieldRef.current = field
	const normalizeValue = useCallback((value: string | null) => {
		if (value === null) {
			return null
		}
		return value
			.replace(/\/+/g, '/')
			.replace(/(?<=.)\/$/, '')
			.replaceAll(/[^/]+/g, it => slugify(it))
	}, [slugify])


	const entity = useEntity()
	const getEntityAccessor = entity.getAccessor
	const desugaredField = useDesugaredRelativeSingleField(fieldName)

	const fieldAccessorGetters = useMemo(() => {
		return derivedFromNormalized.map((it): FieldAccessor.GetFieldAccessor => {
			if (typeof it === 'function') {
				return it
			}
			return getEntityAccessor().getField(it).getAccessor
		})

	}, [getEntityAccessor, derivedFromNormalized])


	const createSlug = useCallback(() => {
		const accessors = fieldAccessorGetters.map(it => it())
		let slugValue: string | null = null
		if (format) {
			slugValue = format(accessors)
		} else {
			const parts = accessors.map(it => it.value !== null ? slugify(it.value as string) : null).filter(it => it !== null)
			if (parts.length > 0) {
				slugValue = parts.join('/') // configurable?
			}
		}
		if (slugValue === null) {
			return null
		}
		return normalizeValue(`${normalizedPersistedHardPrefix}${normalizedPersistedSoftPrefix}${slugValue}`)
	}, [fieldAccessorGetters, format, normalizeValue, normalizedPersistedHardPrefix, normalizedPersistedSoftPrefix, slugify])

	const handleUpdateSlug = useCallback(() => {
		getEntityAccessor().batchUpdates(getAccessor => {
			const targetEntity = getAccessor().getEntity(desugaredField)
			const targetField = getAccessor().getField(desugaredField)
			if (targetField.isTouched) {
				return
			}
			if (targetEntity.existsOnServer && targetField.value !== null) {
				return
			}
			const slug = createSlug()
			if (slug !== null) {
				targetField.updateValue(slug, { agent: 'derivedField' })
			}
		})
	}, [createSlug, desugaredField, getEntityAccessor])

	useEffect(() => {
		const targetField = getEntityAccessor().getField(desugaredField)
		if (targetField.value !== null) {
			return
		}
		handleUpdateSlug()
		fieldAccessorGetters.forEach(it => {
			it().addEventListener({ type: 'beforeUpdate' }, handleUpdateSlug)
		})
	}, [desugaredField, fieldAccessorGetters, format, getEntityAccessor, handleUpdateSlug])

	const hardPrefix = normalizedUnpersistedHardPrefix + normalizedPersistedHardPrefix

	return {
		unpersistedHardPrefix: normalizedUnpersistedHardPrefix,
		persistedHardPrefix: normalizedPersistedHardPrefix,
		persistedSoftPrefix: normalizedPersistedSoftPrefix,
		hardPrefix,
		fullValue: field.value !== null ? `${normalizedUnpersistedHardPrefix}${field.value}` : null,
		onBlur: useCallback(() => {
			fieldRef.current.updateValue(normalizeValue(fieldRef.current.value))
		}, [normalizeValue]),
		parseValue: useCallback<FormInputHandler['parseValue']>(val => {
			const parsedValue = val ?? null
			return parsedValue !== null ? `${normalizedPersistedHardPrefix}${parsedValue}` : null
		}, [normalizedPersistedHardPrefix]),
		formatValue: useCallback<FormInputHandler['formatValue']>(value => {
			return typeof value === 'string' ? value.substring(normalizedPersistedHardPrefix.length) : ''
		}, [normalizedPersistedHardPrefix]),
	}
}

const useNormalizedPrefix = (value?: SlugPrefix) => {
	const environment = useEnvironment()
	return useMemo(() => typeof value === 'function' ? value(environment) : value ?? '', [value, environment])
}
