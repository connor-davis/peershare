import { cn } from '@/lib/utils'

export default function Loading(...props) {
  return (
    <svg className={cn('h-6 w-6 animate-spin', props.className)} {...props} viewBox="0 0 100 100">
      <circle
        fill="none"
        strokeWidth="10"
        className="stroke-current opacity-40"
        cx="50"
        cy="50"
        r="40"
      />
      <circle
        fill="none"
        strokeWidth="10"
        className="stroke-current"
        strokeDasharray="250"
        strokeDashoffset="210"
        cx="50"
        cy="50"
        r="40"
      />
    </svg>
  )
}
