import { SugaredRelativeSingleField, useEnvironment, useField, useMutationState, useLabelMiddleware } from '@contember/react-binding'
import { FieldContainer, FieldContainerProps } from '@contember/ui'
import { NonOptional } from '@contember/utilities'
import { CSSProperties, ReactNode, memo, useMemo } from 'react'
import { useAccessorErrors } from '@contember/react-binding-ui'
import type { SimpleRelativeSingleFieldMetadata } from './SimpleRelativeSingleField'

// Props that are handled by the FieldContainer:
export type SimpleRelativeSingleFieldProxyFieldContainerProps = Omit<FieldContainerProps, 'children' | 'className' | 'style'>

// Common outer props all fields might want to use (e.g. to style field):
export type SimpleRelativeSingleFieldProxyExtraProps = {
	className?: string | undefined;
	containerClassName?: string | undefined;
	containerStyle?: CSSProperties | undefined;
	style?: CSSProperties | undefined;
	suppressErrors?: boolean | undefined;
}

// Keys that are passed to the render() function:
export type RenderedSugaredRelativeSingleFieldKeys = 'field'
export type RenderedSimpleRelativeSingleFieldProxyExtraPropsKeys = 'className' | 'style'
export type RenderedSimpleRelativeSingleFieldProxyFieldContainerPropsKeys = 'required' | 'size' | 'errors'

// Generics for props that will be passed to the 2nd argument of render() function:
export type SimpleRelativeSingleFieldProxyExcludeHandledProps<P extends SimpleRelativeSingleFieldProxyProps> = Omit<
	P,
	| Exclude<keyof SugaredRelativeSingleField, RenderedSugaredRelativeSingleFieldKeys>
	| Exclude<keyof SimpleRelativeSingleFieldProxyExtraProps, RenderedSimpleRelativeSingleFieldProxyExtraPropsKeys>
	| Exclude<keyof SimpleRelativeSingleFieldProxyFieldContainerProps, RenderedSimpleRelativeSingleFieldProxyFieldContainerPropsKeys>
>

// Inversion of SimpleRelativeSingleFieldProxyExcludeHandledProps<P> generics
// used for type check to make sure all the props are passed to the render() function:
// - all props are required, without `?`
// - `undefined` is used where `?` was used
type PropsPassedToRendererCheck = NonOptional<
	& Pick<SugaredRelativeSingleField, RenderedSugaredRelativeSingleFieldKeys>
	& Pick<SimpleRelativeSingleFieldProxyExtraProps, RenderedSimpleRelativeSingleFieldProxyExtraPropsKeys>
	& Pick<SimpleRelativeSingleFieldProxyFieldContainerProps, RenderedSimpleRelativeSingleFieldProxyFieldContainerPropsKeys>
>

// Rended props used by SimpleRelativeSingleField:
export type SimpleRelativeSingleFieldProxyRendererProps = {
	render: (
		fieldMetadata: SimpleRelativeSingleFieldMetadata<any>,
		props: SimpleRelativeSingleFieldProxyExcludeHandledProps<any>,
	) => ReactNode;
}

export type SimpleRelativeSingleFieldProxyProps =
	& SimpleRelativeSingleFieldProxyFieldContainerProps
	& SugaredRelativeSingleField
	& SimpleRelativeSingleFieldProxyExtraProps

/**
 * @internal
 */
export const SimpleRelativeSingleFieldProxy = memo(
	({
		render,
		// Used by useField():
		defaultValue, isNonbearing, onBeforeUpdate, onInitialize, onUpdate,
		// Used only by FieldContainer:
		description, display, evenly, footer, horizontal, gap, label, labelDescription, labelPosition, reverse, useLabelElement,
		// Used only by render():
		className, componentClassName, style,
		// Used by both render() and FieldContainer:
		errors, field: fieldName, required, size,
		// Used by this proxy:
		containerClassName,
		containerStyle,
		suppressErrors,
		// Rest should be empty:
		...rest
	}: SimpleRelativeSingleFieldProxyProps & SimpleRelativeSingleFieldProxyRendererProps) => {
		if (import.meta.env.DEV) {
			const exhaustiveCheck: Record<string, never> = rest
		}

		const labelMiddleware = useLabelMiddleware()
		const normalizedLabel = useMemo(() => labelMiddleware(label), [labelMiddleware, label])

		const useFieldProps: SugaredRelativeSingleField = { defaultValue, field: fieldName, isNonbearing, onBeforeUpdate, onInitialize, onUpdate }

		const field = useField(useFieldProps)
		const fieldErrors = useAccessorErrors(field.errors?.errors)

		const combinedErrors = !suppressErrors ? combineErrorMessages(errors, fieldErrors) : undefined

		const fieldContainerProps: NonOptional<Omit<FieldContainerProps, 'children'>> = {
			description, display, errors: combinedErrors, evenly, footer, horizontal, gap, label: normalizedLabel, labelDescription, labelPosition, required, reverse, size, useLabelElement,
			className: containerClassName, componentClassName, style: containerStyle,
		}
		const renderProps: PropsPassedToRendererCheck = { field: fieldName, className, style, required, size, errors, ...rest }

		const isMutating = useMutationState()

		const environment = useEnvironment()
		const fieldMetadata: SimpleRelativeSingleFieldMetadata = useMemo(
			() => ({
				field,
				environment,
				isMutating,
			}),
			[environment, field, isMutating],
		)

		const rendered = render(fieldMetadata, renderProps)

		return (
			<>
				{rendered && (
					<FieldContainer {...fieldContainerProps}>{rendered}</FieldContainer>
				)}
			</>
		)
	},
)
SimpleRelativeSingleFieldProxy.displayName = 'SimpleRelativeSingleFieldProxy'

function combineErrorMessages(
	errors: FieldContainerProps['errors'],
	fieldErrors: ReturnType<typeof useAccessorErrors>,
): FieldContainerProps['errors'] {
	if (!errors && !fieldErrors) {
		return undefined
	} else {
		return [
			...errors ?? [],
			...fieldErrors ?? [],
		]
	}
}
