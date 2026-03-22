import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { box: '32px', font: '14px' },
  md: { box: '48px', font: '20px' },
  lg: { box: '64px', font: '28px' },
}

export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  const { box, font } = sizeMap[size]

  return (
    <div
      className={cn('avatar', className)}
      style={{ width: box, height: box, fontSize: font }}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}
