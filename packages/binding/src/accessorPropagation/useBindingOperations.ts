import * as React from 'react'
import { BindingOperationsContext } from './BindingOperationsContext'

export const useBindingOperations = () => React.useContext(BindingOperationsContext)
