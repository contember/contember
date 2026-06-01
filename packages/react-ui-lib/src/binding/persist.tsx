import { PersistTrigger } from '@contember/interface'
import { ComponentProps, ReactNode } from 'react'
import { dict } from '@contember/react-ui-lib-base'
import { Button } from '@contember/react-ui-lib-base'
import { Loader } from '@contember/react-ui-lib-base'
import { usePersistSuccessHandler } from './hooks.js'
import { cn } from '@contember/react-ui-lib-base'

export interface PersistButtonProps extends ComponentProps<typeof Button> {
	label?: ReactNode
}

export const PersistButton = ({ label, className, ...buttonProps }: PersistButtonProps) => {
	return (
		<PersistTrigger onPersistSuccess={usePersistSuccessHandler()}>
			<Button className={cn('group', className)} {...buttonProps}>
				<Loader size="sm" position="absolute" className="hidden group-data-[loading]:block" />
				{label ?? dict.persist.persistButton}
			</Button>
		</PersistTrigger>
	)
}
