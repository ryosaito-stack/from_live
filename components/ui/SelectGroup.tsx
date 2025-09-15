'use client'

import React from 'react'
import { Group } from '@/types'

interface SelectGroupProps {
  groups: Group[]
  value: string
  onChange: (value: string) => void
  hasVoted: (groupId: string) => boolean
  disabled?: boolean
}

export function SelectGroup({ groups, value, onChange, hasVoted, disabled }: SelectGroupProps) {
  return (
    <select
      id="group-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
    >
      <option value="">選択してください</option>
      {groups.map((group) => {
        const voted = hasVoted(group.id)
        return (
          <option key={group.id} value={group.id} disabled={voted}>
            {group.name}{voted ? '（投票済み）' : ''}
          </option>
        )
      })}
    </select>
  )
}
