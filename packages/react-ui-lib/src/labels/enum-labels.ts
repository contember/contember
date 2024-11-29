import { SugaredRelativeSingleField, TreeNodeEnvironmentFactory, useEnvironment } from '@contember/interface'
import { createContext } from '@contember/react-utils'
import { ReactNode, useMemo } from 'react'

export type EnumOptionsFormatter = (enumName: string) => Record<string, ReactNode>

export const [, useEnumOptionsFormatter, EnumOptionsFormatterProvider] = createContext<EnumOptionsFormatter>('EnumOptionsFormatterContext', enumName => {
	throw new Error('EnumOptionsFormatterProvider is not provided')
})
