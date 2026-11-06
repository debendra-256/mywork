import { useEffect, useRef, useState } from 'react'

/**
 * True once the element is close to the viewport. Below-the-fold sections use it
 * to postpone their API calls, so a first visit paints the content people
 * actually see before the network gets busy.
 */
export function useInView<T extends HTMLElement>(rootMargin = '400px') {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (inView) return
    const element = ref.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      setInView(true)
      observer.disconnect()
    }, { rootMargin })
    observer.observe(element)
    return () => observer.disconnect()
  }, [inView, rootMargin])
  return { ref, inView }
}

/** Runs best-effort work after the browser is done with the first paint. */
export function whenIdle(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout: 2500 })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(callback, 300)
  return () => window.clearTimeout(id)
}
