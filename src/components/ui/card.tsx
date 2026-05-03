import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  as?: React.ElementType
}

export function Card({ className, children, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={cn(
        'bg-cream-100 border border-cream-200 rounded-lg p-4',
        'shadow-xs',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
