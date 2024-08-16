import { ReactNode, useContext } from 'react'
import type { BindingOperations } from '@contember/binding'
import { BindingOperationsContext } from './BindingOperationsContext'

export const useBindingOperations = (): BindingOperations<ReactNode> => useContext(BindingOperationsContext)
