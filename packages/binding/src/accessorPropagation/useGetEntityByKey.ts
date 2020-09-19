import * as React from 'react'
import { BindingOperationsContext } from './BindingOperationsContext'

export const useGetEntityByKey = () => React.useContext(BindingOperationsContext).getEntityByKey
