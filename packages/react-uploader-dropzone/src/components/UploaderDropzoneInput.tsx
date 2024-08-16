import { useUploaderDropzoneState } from '../internal/contexts'
import * as React from 'react'

export const UploaderDropzoneInput = () => {
	const { getInputProps } = useUploaderDropzoneState()

	return <input {...getInputProps()} />
}
