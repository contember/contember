import {
	ReactNode,
	ReactElement,
	useMemo,
	useCallback,
	useEffect,
	useRef,
	ComponentType,
	MouseEvent as ReactMouseEvent,
	memo,
	useState,
	useContext,
} from 'react'
import { Box } from '../Box'
import { ErrorList, ErrorListProps } from './ErrorList'

export interface FieldSetProps extends ErrorListProps {
	legend: ReactNode
	children: ReactNode
}

export const FieldSet = memo<FieldSetProps>(props => (
	<Box heading={props.legend}>
		<ErrorList size={props.size} errors={props.errors} />
		{props.children}
	</Box>
))
FieldSet.displayName = 'FieldSet'
