import * as ReactDOM from 'react-dom'
import { ReactElement } from 'react'

export type ReactRenderer = (domElement: Element, reactElement: ReactElement, onRecoverableError: (e: any) => void) => void

export const legacyReactRenderer: ReactRenderer = (domElement, reactElement) => ReactDOM.render(reactElement, domElement)
