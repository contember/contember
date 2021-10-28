import { forwardRef, memo, ReactNode } from 'react'
import { Button, ButtonProps } from './Forms/Button'

export interface SaveButtonProps extends ButtonProps {
	isPrimary?: ReactNode
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
			flow={flow ?? 'block'}
			scheme={isPrimary ? 'dark' : scheme }
			distinction={rest.disabled ? 'seamless' : distinction}
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
