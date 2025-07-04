import { uic } from '../utils'
import { Label } from '../ui/label'

/**
 * FormLayout component - Core layout container for form elements
 *
 * #### Purpose
 * Provides consistent spacing and layout structure for form components
 *
 * #### Features
 * - Vertical flex layout with gap spacing
 * - Side margins for visual balance
 * - Uses Tailwind classes: `flex flex-col gap-2 mx-4`
 *
 * #### Example
 * ```tsx
 * <FormLayout>
 *   <InputField field="username" />
 * </FormLayout>
 * ```
 */
export const FormLayout = uic('div', {
	baseClass: 'flex flex-col gap-2 mx-4',
	displayName: 'FormLayout',
})

/**
 * FormDescriptionUI component - Styled text for form field descriptions
 *
 * #### Purpose
 * Displays secondary help text below form fields
 *
 * #### Features
 * - Small muted text style
 * - Uses Tailwind classes: `text-[0.8rem] text-muted-foreground`
 *
 * #### Example
 * ```tsx
 * <FormDescriptionUI>
 *   Must be at least 8 characters
 * </FormDescriptionUI>
 * ```
 */
export const FormDescriptionUI = uic('p', {
	baseClass: 'text-[0.8rem] text-muted-foreground',
	displayName: 'FormDescription',
})

/**
 * FormErrorUI component - Error message display for form validation
 *
 * #### Purpose
 * Shows validation error messages in consistent destructive style
 *
 * #### Features
 * - Red destructive color scheme
 * - Small bold text
 * - Uses Tailwind classes: `text-[0.8rem] font-medium text-destructive`
 *
 * #### Example
 * ```tsx
 * <FormErrorUI>Invalid email format</FormErrorUI>
 * ```
 */
export const FormErrorUI = uic('p', {
	baseClass: 'text-[0.8rem] font-medium text-destructive',
	displayName: 'FormError',
})

/**
 * FormLabelWrapperUI component - Container for form labels
 *
 * #### Purpose
 * Wraps label elements for proper alignment and spacing
 *
 * #### Features
 * - Flex container layout
 * - Base Tailwind class: `flex`
 *
 * #### Example
 * ```tsx
 * <FormLabelWrapperUI>
 *   <FormLabelUI>Email Address</FormLabelUI>
 * </FormLabelWrapperUI>
 * ```
 */
export const FormLabelWrapperUI = uic('div', {
	baseClass: 'flex',
	displayName: 'FormLabelWrapper',
})

/**
 * FormLabelUI component - Styled label for form fields
 *
 * #### Purpose
 * Displays accessible labels with required state indicators
 *
 * #### Features
 * - Left-aligned text
 * - Dynamic required indicator (red asterisk)
 * - Variant support for required state
 * - Default required marker: '*'
 *
 * #### Variants
 * - `required`: Controls display of required indicator (true/false)
 *
 * #### Example: Basic usage
 * ```tsx
 * <FormLabelUI>Password</FormLabelUI>
 * ```
 *
 * #### Example: With required indicator
 * ```tsx
 * <FormLabelUI required>Username</FormLabelUI>
 * ```
 */
export const FormLabelUI = uic(Label, {
	baseClass: 'text-left data-[required]:after:text-destructive data-[required]:after:content-[attr(data-required-content)] after:ml-1',
	displayName: 'FormLabel',
	variants: {
		required: {
			true: 'after:text-destructive after:content-[attr(data-required-content)] after:ml-1',
			false: '',
		},
	},
	defaultProps: {
		['data-required-content']: '*',
	} as any,
})

/**
 * FormContainerUI component - Wrapper for individual form fields
 *
 * #### Purpose
 * Creates consistent spacing and layout for form field groups
 *
 * #### Features
 * - Vertical flex layout
 * - Full width container
 * - Uses Tailwind classes: `flex flex-col gap-2 w-full`
 *
 * #### Example
 * ```tsx
 * <FormContainerUI>
 *   <FormLabelUI>Email</FormLabelUI>
 *   <InputField field="email" />
 * </FormContainerUI>
 * ```
 */
export const FormContainerUI = uic('div', {
	baseClass: 'flex flex-col gap-2 w-full',
	displayName: 'FormContainer',
})
