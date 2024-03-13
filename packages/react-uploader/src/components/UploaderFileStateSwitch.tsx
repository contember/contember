import { ComponentType, createElement, isValidElement, ReactElement } from 'react'
import { useUploaderFileState } from '../contexts'
import { UploaderFileStateError, UploaderFileStateFinalizing, UploaderFileStateInitial, UploaderFileStateSuccess, UploaderFileStateUploading } from '../types'

export interface UploaderFileStateSwitchProps {
	initial?: ReactElement | ComponentType<UploaderFileStateInitial>
	uploading?: ReactElement | ComponentType<UploaderFileStateUploading>
	finalizing?: ReactElement | ComponentType<UploaderFileStateFinalizing>
	success?: ReactElement | ComponentType<UploaderFileStateSuccess>
	error?: ReactElement | ComponentType<UploaderFileStateError>
}

export const UploaderFileStateSwitch = (props: UploaderFileStateSwitchProps) => {
	const state = useUploaderFileState()
	const el = props[state.state]
	if (!el) {
		return null
	}
	if (isValidElement(el)) {
		return el
	}
	return createElement(el as ComponentType<any>, state)
}
