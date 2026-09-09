import React from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Brain, Zap } from 'lucide-react'

export type AnalysisMode = 'simple' | 'deep'

interface AnalysisModeToggleProps {
  mode: AnalysisMode
  onChange: (mode: AnalysisMode) => void
  className?: string
}

export default function AnalysisModeToggle({ mode, onChange, className = '' }: AnalysisModeToggleProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span 
        className="text-sm font-medium"
        style={{ 
          color: '#a1a1aa',
          fontSize: '14px'
        }}
      >
        Analysis Mode:
      </span>
      
      <div className="flex items-center bg-muted rounded-lg p-1" style={{ backgroundColor: '#111111' }}>
        <Button
          variant={mode === 'simple' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange('simple')}
          className="h-8 px-3 text-xs transition-all duration-200"
          style={{
            backgroundColor: mode === 'simple' ? '#facc15' : 'transparent',
            color: mode === 'simple' ? '#0a0a0a' : '#a1a1aa',
            borderRadius: '6px',
            fontWeight: 600,
            border: 'none'
          }}
        >
          <Zap className="w-3 h-3 mr-1" />
          Simple
        </Button>
        
        <Button
          variant={mode === 'deep' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange('deep')}
          className="h-8 px-3 text-xs transition-all duration-200"
          style={{
            backgroundColor: mode === 'deep' ? '#facc15' : 'transparent',
            color: mode === 'deep' ? '#0a0a0a' : '#a1a1aa',
            borderRadius: '6px',
            fontWeight: 600,
            border: 'none'
          }}
        >
          <Brain className="w-3 h-3 mr-1" />
          Deep Think
        </Button>
      </div>
      
      <div className="flex items-center">
        {mode === 'simple' ? (
          <Badge 
            variant="secondary" 
            className="text-xs"
            style={{
              backgroundColor: '#262626',
              color: '#a1a1aa',
              borderRadius: '6px',
              border: 'none'
            }}
          >
            Quick & Focused
          </Badge>
        ) : (
          <Badge 
            variant="secondary" 
            className="text-xs"
            style={{
              backgroundColor: '#262626',
              color: '#a1a1aa',
              borderRadius: '6px',
              border: 'none'
            }}
          >
            Comprehensive & Detailed
          </Badge>
        )}
      </div>
    </div>
  )
}
