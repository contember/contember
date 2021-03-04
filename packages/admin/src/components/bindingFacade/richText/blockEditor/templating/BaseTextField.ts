import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { BlockSlateEditor } from '../editor'

export interface BaseTextField {
	placeholder: ReactNode
	render: (props: { isEmpty: boolean; children: ReactNode; editor: BlockSlateEditor }) => ReactNode
}
