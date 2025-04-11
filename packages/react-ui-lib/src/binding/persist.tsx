import { PersistTrigger } from '@contember/interface'
import { ComponentProps, ReactNode } from 'react'
import { dict } from '../dict'
import { Button } from '../ui/button'
import { Loader } from '../ui/loader'
import { usePersistSuccessHandler } from './hooks'
import { cn } from '../utils'

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
