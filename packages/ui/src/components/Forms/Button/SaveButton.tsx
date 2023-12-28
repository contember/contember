import { forwardRef, memo } from 'react'
import { Button } from './Button'
import { ButtonProps } from './Types'

export type SaveButtonProps =
	& {
		isPrimary?: boolean
		labelSave?: string
		labelSaved?: string
		isDirty: boolean
	}
	& ButtonProps

/**
 * @group UI
 */
export const SaveButton = memo(forwardRef<HTMLButtonElement, SaveButtonProps>(({
	distinction,
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
		componentClassName={['button', 'save-button']}
		className={[rest.className]}
		distinction={isPrimary ? 'primary' : distinction}
		scheme={scheme}
		size={size}
		{...rest}
	>
		{isDirty
			? (labelSave ?? 'Save')
			: (labelSaved ?? 'Save')
		}
	</Button>
)))

SaveButton.displayName = 'SaveButton'
