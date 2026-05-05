import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import type { Group } from '@/types'

interface Props {
  group: Group
  isCreator: boolean
}

export default function GroupCard({ group, isCreator }: Props) {
  return (
    <Link href={`/groups/${group.id}`}>
      <Card hoverable className="h-full">
        <CardContent className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FF471A1A] border border-[#FF471A33] flex items-center justify-center shrink-0">
            <span className="text-xl">👥</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-text-primary font-bold text-sm truncate">{group.name}</p>
              {isCreator && (
                <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#FF471A1A] border border-[#FF471A33] text-[#FF471A]">
                  Admin
                </span>
              )}
            </div>
            <p className="text-text-muted text-xs">
              {group.memberCount} {group.memberCount === 1 ? 'miembro' : 'miembros'}
            </p>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted shrink-0"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </CardContent>
      </Card>
    </Link>
  )
}
