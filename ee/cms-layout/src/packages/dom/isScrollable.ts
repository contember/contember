/**
 * Checks if an element is scrollable
 * @param element Element to check
 * @returns Boolean indicating if the element is scrollable
 */
export function isScrollable(element: HTMLElement | null) {
  if (element === document.scrollingElement) {
    return true
  } else if (element instanceof HTMLElement) {
    const contentOverflows = element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth

    if (contentOverflows) {
      if ((getComputedStyle(element)).overflow === 'hidden') {
        return false
      } else {
        return contentOverflows
      }
    } else {
      return false
    }
  } else {
    return false
  }
}
