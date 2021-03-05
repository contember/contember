import { useContext } from 'react'
import { BindingOperationsContext } from './BindingOperationsContext'

export const useBindingOperations = () => useContext(BindingOperationsContext)
