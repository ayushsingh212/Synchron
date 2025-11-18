import { useEffect, useState } from 'react'


export default function usePrefersReducedMotion() {
const [prefersReduced, setPrefersReduced] = useState(false)


useEffect(() => {
const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
setPrefersReduced(mq.matches)
const handler = () => setPrefersReduced(mq.matches)
try {
mq.addEventListener('change', handler)
} catch {
// Safari fallback
// @ts-ignore
mq.addListener(handler)
}
return () => {
try {
mq.removeEventListener('change', handler)
} catch {
// @ts-ignore
mq.removeListener(handler)
}
}
}, [])


return prefersReduced
}