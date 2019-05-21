import * as React from 'react'
import { Button, Intent } from '../../../components'
import { MetaOperationsContext } from '../../coreComponents'

export type PersistButtonProps = React.PropsWithChildren<{}>

export const PersistButton = React.memo((props: PersistButtonProps) => {
	const [isLoading, setIsLoading] = React.useState(false)
	const value = React.useContext(MetaOperationsContext)

	const getOnPersist = (triggerPersist: () => Promise<void>) => () => {
		if (isLoading) {
			return
		}

		triggerPersist().finally(() => setIsLoading(false))
		setIsLoading(true)
	}

	if (value) {
		return (
			<Button
				intent={Intent.Success}
				// icon="floppy-disk"
				onClick={getOnPersist(value.triggerPersist)}
				// intent={Intent.PRIMARY}
				// loading={this.state.isLoading}
				// large={true}
			>
				{props.children || 'Save'}
			</Button>
		)
	}
	return null
})
