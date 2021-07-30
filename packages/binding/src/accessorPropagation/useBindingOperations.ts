import { useContext } from 'react'
import type { BindingOperations } from '../accessors'
import { BindingOperationsContext } from './BindingOperationsContext'

export const useBindingOperations = (): BindingOperations => useContext(BindingOperationsContext)
