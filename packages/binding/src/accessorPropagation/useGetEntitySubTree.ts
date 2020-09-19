import * as React from 'react'
import { BindingOperationsContext } from './BindingOperationsContext'

export const useGetEntitySubTree = () => React.useContext(BindingOperationsContext).getEntitySubTree
