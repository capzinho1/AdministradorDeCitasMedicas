'use client'

import { Home, LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface SidebarItem {
  label: string
  icon: LucideIcon
  path: string
}

interface SidebarProps {
  title: string
  items: SidebarItem[]
  color: string
}

export default function Sidebar({ title, items, color }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={`w-64 bg-gradient-to-b ${color} text-white min-h-screen p-6 shadow-xl`}>
      {/* Logo/Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <div className="h-1 w-16 bg-white rounded"></div>
      </div>

      {/* Navigation Items */}
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-white text-gray-800 shadow-lg font-semibold' 
                  : 'hover:bg-white/20'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Back to Home */}
      <div className="mt-12 pt-6 border-t border-white/20">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/20 transition-all"
        >
          <Home className="w-5 h-5" />
          <span>Volver al Inicio</span>
        </Link>
      </div>
    </div>
  )
}

