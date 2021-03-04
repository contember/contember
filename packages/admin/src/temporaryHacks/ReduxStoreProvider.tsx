import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { Provider, ProviderProps } from 'react-redux'

export interface ReduxStoreProviderProps extends ProviderProps {
	children?: ReactNode
}

// This allows us to expose the provider without running into bundling issues.
export const ReduxStoreProvider = (props: ReduxStoreProviderProps) => <Provider {...props} />
