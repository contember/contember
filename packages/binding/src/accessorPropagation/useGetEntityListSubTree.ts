import * as React from 'react'
import { BindingOperationsContext } from './BindingOperationsContext'

export const useGetEntityListSubTree = () => React.useContext(BindingOperationsContext).getEntityListSubTree
