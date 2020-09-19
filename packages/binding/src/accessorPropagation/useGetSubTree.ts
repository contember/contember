import * as React from 'react'
import { BindingOperationsContext } from './BindingOperationsContext'

export const useGetSubTree = () => React.useContext(BindingOperationsContext).getSubTree
