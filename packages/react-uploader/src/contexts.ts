import { createContext, createRequiredContext } from '@contember/react-utils'
import { UploaderFileState, UploaderState } from './types'
import { ErrorAccessor } from '@contember/binding'
import { UploadClient } from './types/uploadClient'
import { UploaderOptions } from './types/options'

export const [UploaderUploadFilesContext, useUploaderUploadFiles] = createRequiredContext<(files: File[]) => void>('UploaderUploadFiles')
export const [UploaderStateContext, useUploaderState] = createRequiredContext<UploaderState>('UploaderState')
export const [UploaderOptionsContext, useUploaderOptions] = createRequiredContext<UploaderOptions>('UploaderOptionsContext')
export const [UploaderErrorsContext, useUploaderErrors] = createRequiredContext<ErrorAccessor.Error[]>('UploaderErrorsContext')

export const [UploaderFileStateContext, useUploaderFileState] = createRequiredContext<UploaderFileState>('UploaderFileStateContext')
export const [UploaderClientContext, useUploaderClient] = createContext<UploadClient<any> | null>('UploaderClientContext', null)
