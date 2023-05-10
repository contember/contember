import { useMemo, useState } from 'react'
import { useOnWindowResize } from './useOnWindowResize'

export function useWindowSize() {
  const [width, setWidth] = useState(window.innerWidth)
  const [height, setHeight] = useState(window.innerHeight)

  useOnWindowResize(() => {
    const { innerHeight, innerWidth } = window
    if (innerHeight !== height) {
      setHeight(innerHeight)
    }

    if (innerWidth !== width) {
      setWidth(innerWidth)
    }
  })

  return useMemo(() => ({ height, width }), [height, width])
}
