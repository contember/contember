import { useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { ComponentClassNameProps, colorSchemeClassName, themeClassName } from '@contember/utilities'
import { PropsWithChildren, memo } from 'react'
import { Intent } from '../../types'
import { Stack } from '../Stack'

export type EmptyStateContainerProps =
	& ComponentClassNameProps
	& PropsWithChildren<{
		header?: React.ReactNode;
		intent?: Intent;
	}>

export const EmptyStateContainer = memo<EmptyStateContainerProps>(({
	children,
	header,
	className: classNameProp,
	intent,
	componentClassName = 'empty-state-container',
}) => {
	const className = useClassNameFactory(componentClassName)

	return (
		<div className={className(null, [
			...themeClassName(intent),
			colorSchemeClassName(useColorScheme()),
			classNameProp,
		])}>
			<Stack direction="vertical" gap="large">
				{header && <div className={className('header')}>{header}</div>}
				{children}
			</Stack>
		</div>
	)
})
EmptyStateContainer.displayName = 'Interface.EmptyStateContainer'
