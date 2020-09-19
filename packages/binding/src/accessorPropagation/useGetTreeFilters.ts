import * as React from 'react'
import { BindingOperationsContext } from './BindingOperationsContext'

export const useGetTreeFilters = () => React.useContext(BindingOperationsContext).getTreeFilters
