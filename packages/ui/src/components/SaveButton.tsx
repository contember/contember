import { forwardRef, memo } from 'react'
import { Button, ButtonProps } from './Forms/Button'

export type SaveButtonProps =
	& {
		isPrimary?: boolean
		labelSave?: string
		labelSaved?: string
		isDirty: boolean
	}
	& ButtonProps

// TODO: Save i18n

/**
 * @group UI
 */
export const SaveButton = memo(forwardRef<HTMLButtonElement, SaveButtonProps>(({
	distinction,
	flow,
	isDirty,
	isPrimary = true,
	labelSave,
	labelSaved,
	scheme,
	size,
	...rest
}, ref) => (
	<Button
		ref={ref}
		size={size ?? 'large'}
		flow={flow}
		scheme={scheme}
		distinction={rest.disabled ? 'seamless' : isPrimary ? 'primary' : distinction}
		{...rest}
	>
		{isDirty
			? (labelSave ?? 'Save')
			: (labelSaved ?? 'Save')
		}
	</Button>
)))

SaveButton.displayName = 'SaveButton'
