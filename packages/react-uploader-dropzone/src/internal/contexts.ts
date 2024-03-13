import { createRequiredContext } from '@contember/react-utils'
import { DropzoneState } from 'react-dropzone'

export const [UploaderDropzoneStateContext, useUploaderDropzoneState] = createRequiredContext<DropzoneState>('UploaderDropzoneStateContext')
