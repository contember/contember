import { createContext } from 'react'
import { I18nMetadata } from './I18nMetadata'

export const I18nContext = createContext<I18nMetadata | undefined>(undefined)
