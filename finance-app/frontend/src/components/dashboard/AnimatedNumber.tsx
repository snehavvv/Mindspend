import { useEffect, useRef, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface AnimatedNumberProps {
  value: number
  currency?: string
  duration?: number
  className?: string
  showColorSign?: boolean
  prefix?: string
}

export function AnimatedNumber({
  value,
  currency = 'USD',
  duration = 900,
  className = '',
  showColorSign = true,
  prefix = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValueRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const startValue = prevValueRef.current
    const targetValue = value
    startTimeRef.current = null

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (targetValue - startValue) * easeOut

      setDisplayValue(current)

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step)
      } else {
        setDisplayValue(targetValue)
        prevValueRef.current = targetValue
      }
    }

    animFrameRef.current = requestAnimationFrame(step)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [value, duration])

  const isPositive = value >= 0
  const colorClass = showColorSign
    ? isPositive
      ? 'text-positive'
      : 'text-negative'
    : 'text-text-primary'

  return (
    <span className={`amount ${colorClass} ${className}`}>
      {prefix}
      {formatCurrency(displayValue, currency)}
    </span>
  )
}
