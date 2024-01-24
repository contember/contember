import { createContext, createRequiredContext } from '@contember/react-utils'
import { zeroInsets } from './Constants'
import { ContainerInsets } from './Types'

export const [SafeAreaInsetsContext, useSafeAreaInsetsContext] = createContext<ContainerInsets>('SafeAreaInsetsContext', zeroInsets)

export const [ContainerInsetsContext, useContainerInsetsContext] = createContext<ContainerInsets>('ContainerInsetsContext', zeroInsets)
