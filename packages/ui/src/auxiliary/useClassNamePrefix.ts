import { useContext } from 'react'
import { GlobalClassNamePrefixContext } from '../contexts'

export const useClassNamePrefix = () => useContext(GlobalClassNamePrefixContext)
