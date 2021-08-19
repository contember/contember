import classNames from 'classnames'
import { ReactNode } from 'react'
import { Icon, SaveControl, Spinner } from '.'
import { useClassNamePrefix } from '../auxiliary'
import { toEnumStateClass } from '../utils'

export interface PersistControlProps {
	label?: ReactNode
	labelSaved ?: ReactNode
	isMutating: boolean
	isDirty: boolean
	onSave: () => void
}

export function PersistControl({
	isDirty,
	isMutating,
	label,
	labelSaved,
	onSave,
}: PersistControlProps) {
	const prefix = useClassNamePrefix()
	const isDisabled = isMutating || !isDirty
	const classList = classNames(
		`${prefix}persistControl`,
		toEnumStateClass(isDirty ? 'dirty' : undefined),
		toEnumStateClass(isDisabled ? 'disabled' : undefined),
		toEnumStateClass(isMutating ? 'mutating' : undefined),
	)

	const labelSavedText = labelSaved ?? 'Saved'
	const labelSaveText = label ?? 'Save'

	const isSaved = isDirty || isMutating

	return (
		<SaveControl
			isPrimaryDisabled={isDisabled}
			onPrimary={isDisabled ? undefined : onSave}
			primaryAction={<span className={classList}>
				<span className={`${prefix}persistControl-label--saved`} aria-hidden={isSaved}>{labelSavedText}</span>
				<span className={`${prefix}persistControl-label--dirty`} aria-hidden={!isSaved}>{labelSaveText}</span>
				<span className={`${prefix}persistControl-icon`} aria-hidden={isSaved}><Icon blueprintIcon={'tick'} /></span>
				{isMutating && <Spinner />}
			</span>}
		/>
	)
}
PersistControl.displayName = 'PersistControl'
