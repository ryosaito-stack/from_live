'use client'

import React from 'react'

interface ScoreSelectorProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function ScoreSelector({ value, onChange, disabled }: ScoreSelectorProps) {
  const scores = [1, 2, 3, 4, 5]

  return (
    <div className="flex gap-2" id="score-selector">
      {scores.map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          disabled={disabled}
          aria-label={`星${score}`}
          className={`
            p-2 rounded-lg transition-all
            ${value >= score
              ? 'text-yellow-500 hover:text-yellow-600'
              : 'text-gray-300 hover:text-gray-400'
            }
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
        >
          <svg
            className="w-8 h-8"
            fill={value >= score ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      ))}
      <span className="ml-2 self-center text-gray-700">
        {value > 0 ? `${value}点` : '未選択'}
      </span>
    </div>
  )
}
