import { EventHandler, SyntheticEvent, useEffect, useRef } from 'react'

/**
 * Similar to useEvent with inferred type for the event parameter according to event type
 *
 * @param type String, keyof DocumentEventMap, e.g. 'click', 'keydown',...
 * @param callback EventHandler
 * @returns Stable reference callback
 */
export function useEventHandler<E extends SyntheticEvent<any>>(type: E['type'], callback: EventHandler<E>): EventHandler<E> {
  const callbackRef = useRef(callback); callbackRef.current = callback

  const stableHandler = useRef(function (event: any) {
    return callbackRef.current(event)
  }).current

  useEffect(() => {
    return () => {
      callbackRef.current = () => { }
    }
  }, [])

  return stableHandler
}
