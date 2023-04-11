import { useRef } from 'react'

/**
 * Returns a stable mutable object with value that is updated upon each call
 *
 * @param value Value that could update after initial call
 * @returns Mutable ref object with updated value
 */
export function useUpdatedRef<T>(value: T) {
  const ref = useRef(value)
  ref.current = value

  return ref
}
