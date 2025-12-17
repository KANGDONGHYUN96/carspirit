'use client'

interface CopyProtectionWrapperProps {
  children: React.ReactNode
  className?: string
}

export default function CopyProtectionWrapper({ children, className = '' }: CopyProtectionWrapperProps) {
  return (
    <div
      className={`select-none ${className}`}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: 'none' }}
    >
      {children}
    </div>
  )
}
