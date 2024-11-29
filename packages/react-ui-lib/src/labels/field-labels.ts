import { createContext } from '@contember/react-utils'
import { ReactNode } from 'react'

export type FieldLabelFormatter = (entityName: string, fieldName: string) => ReactNode | null

export const [, useFieldLabelFormatter, FieldLabelFormatterProvider] = createContext<FieldLabelFormatter>('FieldLabelContext', (entityName, fieldName) => null)

