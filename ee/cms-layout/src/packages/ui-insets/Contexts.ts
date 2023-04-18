import { createNonNullableContextFactory } from '../react-context-utilities'
import { zeroInsets } from './Constants'
import { ContainerInsets } from './Types'

export const [SafeAreaInsetsContext, useSafeAreaInsetsContext] = createNonNullableContextFactory<ContainerInsets>(
	'SafeAreaInsetsContext',
	zeroInsets,
)

export const [ContainerInsetsContext, useContainerInsetsContext] = createNonNullableContextFactory<ContainerInsets>(
	'ContainerInsetsContext',
	zeroInsets,
)
