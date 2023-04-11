export function getMatchingParentElement(element: HTMLElement | null, predicate: (element: HTMLElement | null) => boolean | Promise<boolean>): HTMLElement {
  if (!element || !element.parentElement) {
    if (document.scrollingElement instanceof HTMLElement) {
      return document.scrollingElement
    } else {
      return document.body
    }
  } else if (predicate(element.parentElement)) {
    return element.parentElement
  } else {
    return getMatchingParentElement(element.parentElement, predicate)
  }
}
