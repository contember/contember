import { forwardRef, memo } from 'react'
import { Button, ButtonProps } from './Forms/Button'

export interface SaveButtonProps extends ButtonProps {
	isPrimary?: boolean
	labelSave?: string
	labelSaved?: string
	isDirty: boolean
}

// TODO: Save i18n
export const SaveButton = memo(
	forwardRef<HTMLButtonElement, SaveButtonProps>(({
		distinction,
		flow,
		isDirty,
		isPrimary = true,
		labelSave,
		labelSaved,
		scheme,
		size,
		...rest
	}, ref) => {
		return <Button
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
		},
	),
)

SaveButton.displayName = 'SaveButton'
