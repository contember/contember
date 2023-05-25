import { CSSProperties } from 'react'

export const visuallyHiddenStyle: CSSProperties = {
  border: '0px',
  clip: 'rect(0px, 0px, 0px, 0px)',
  clipPath: 'inset(50%)',
  height: '1px',
  margin: '0px -1px -1px 0px',
  overflow: 'hidden',
  padding: '0px',
  position: 'absolute',
  width: '1px',
  whiteSpace: 'nowrap',
}
