import * as React from 'react'
import { GlobalClassNamePrefixContext } from '../contexts'

export const useClassNamePrefix = () => React.useContext(GlobalClassNamePrefixContext)
