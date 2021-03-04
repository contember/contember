import { ErrorList, FieldErrors } from '@contember/ui'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'

export interface CheckboxProps {
	checked: boolean
	readOnly?: boolean
	errors?: FieldErrors
	onChange: (isChecked: boolean) => void
	children: ReactNode
}

export const Checkbox = memo((props: CheckboxProps) => (
	<div className="checkbox">
		<ErrorList errors={props.errors} />
		<label className="checkbox-in">
			<input
				type="checkbox"
				checked={props.checked}
				readOnly={props.readOnly}
				onChange={e => props.onChange(e.currentTarget.checked)}
			/>
			<span className="checkbox-box" />
			<span className="checkbox-label">{props.children}</span>
		</label>
	</div>
))
