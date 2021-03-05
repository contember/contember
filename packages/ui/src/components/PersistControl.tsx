import cn from 'classnames'
import { ContentStatus, SaveControl } from '.'
import { useClassNamePrefix } from '../auxiliary'

export interface PersistControlProps {
	isMutating: boolean
	isDirty: boolean
	onSave: () => void
}

export function PersistControl({ isMutating, isDirty, onSave }: PersistControlProps) {
	const prefix = useClassNamePrefix()

	const isDisabled = isMutating || !isDirty

	const message = isMutating ? 'Saving…' : !isDirty ? 'All saved' : 'Unsaved changes'

	return (
		<div className={`${prefix}persistControl`}>
			<div className={`${prefix}persistControl-label`}>
				<ContentStatus label={message} />
			</div>
			<SaveControl isPrimaryDisabled={isDisabled} primaryAction="Save" onPrimary={isDisabled ? undefined : onSave} />
		</div>
	)
}
PersistControl.displayName = 'PersistControl'
