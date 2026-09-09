import { useState } from 'react'
import { GitCompare } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

interface CompareCompaniesFormProps {
  onCompare: (company1: string, company2: string, section: string) => void
}

const sections = [
  'All',
  'Finance',
  'HR', 
  'Product',
  'Sales',
  'Marketing',
  'Operations',
  'Legal',
  'IT',
  'Executive'
]

export default function CompareCompaniesForm({ onCompare }: CompareCompaniesFormProps) {
  const [company1, setCompany1] = useState('')
  const [company2, setCompany2] = useState('')
  const [section, setSection] = useState('All')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (company1.trim() && company2.trim()) {
      onCompare(company1.trim(), company2.trim(), section)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && company1.trim() && company2.trim()) {
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      {/* Mobile Layout - visible only on small screens */}
      <div className="md:hidden space-y-4 mb-4">
        <div>
          <Label htmlFor="company1-mobile" className="text-sm font-medium text-foreground mb-2 block">
            Company 1 (Name or URL)
          </Label>
          <Input
            id="company1-mobile"
            type="text"
            value={company1}
            onChange={(e) => setCompany1(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Company name or https://..."
            className="w-full h-12 bg-card border-border text-foreground"
            style={{
              backgroundColor: '#1a1a1a',
              borderColor: '#262626',
              color: '#f9f9f9'
            }}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="company2-mobile" className="text-sm font-medium text-foreground mb-2 block">
            Company 2 (Name or URL)
          </Label>
          <Input
            id="company2-mobile"
            type="text"
            value={company2}
            onChange={(e) => setCompany2(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Company name or https://..."
            className="w-full h-12 bg-card border-border text-foreground"
            style={{
              backgroundColor: '#1a1a1a',
              borderColor: '#262626',
              color: '#f9f9f9'
            }}
            required
          />
        </div>

        <div>
          <Label htmlFor="section-mobile" className="text-sm font-medium text-foreground mb-2 block">
            Department
          </Label>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger 
              id="section-mobile"
              className="w-full h-12 bg-card border-border text-foreground"
              style={{
                backgroundColor: '#1a1a1a',
                borderColor: '#262626',
                color: '#f9f9f9'
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent 
              className="shadow-lg"
              style={{ 
                backgroundColor: '#1a1a1a', 
                borderColor: '#262626',
                borderRadius: '12px',
                boxShadow: '0 0 12px rgba(0,0,0,0.6)'
              }}
            >
              {sections.map((sectionOption) => (
                <SelectItem 
                  key={sectionOption} 
                  value={sectionOption}
                  className="
                    cursor-pointer transition-colors duration-200
                    focus:bg-transparent data-[highlighted]:bg-transparent
                    text-[#f9f9f9] font-sans px-3 py-2 rounded-md m-0.5 bg-transparent
                    hover:bg-[#facc1520] hover:text-[#facc15]
                  "
                >
                  <span className="block">{sectionOption}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={!company1.trim() || !company2.trim()}
          className="w-full h-12 font-bold transition-all duration-200 disabled:opacity-50"
          style={{
            backgroundColor: '#facc15',
            color: '#0a0a0a',
            borderRadius: '9999px'
          }}
        >
          <GitCompare className="w-4 h-4 mr-2" />
          Compare Companies
        </Button>
      </div>

      {/* Desktop Pill Search Bar - hidden on mobile */}
      <div 
        className="hidden md:flex items-center rounded-full border shadow-lg overflow-hidden"
        style={{
          backgroundColor: '#1a1a1a',
          borderColor: '#262626',
          boxShadow: '0 0 12px rgba(0,0,0,0.6)'
        }}
      >
        {/* Hidden labels for accessibility */}
        <Label htmlFor="company1-desktop" className="sr-only">Company 1</Label>
        <Label htmlFor="company2-desktop" className="sr-only">Company 2</Label>
        <Label htmlFor="section-desktop" className="sr-only">Department</Label>

        {/* Company 1 Input */}
        <div className="flex-1 px-6 py-4">
          <Input
            id="company1-desktop"
            type="text"
            value={company1}
            onChange={(e) => setCompany1(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Company 1 name or URL..."
            className="border-0 bg-transparent text-base focus:ring-0 focus:outline-none p-0 h-auto"
            style={{
              color: '#f9f9f9',
              fontFamily: 'Inter, sans-serif'
            }}
            required
          />
        </div>

        {/* Divider */}
        <div 
          className="w-px h-8"
          style={{ backgroundColor: '#262626' }}
        />

        {/* Company 2 Input */}
        <div className="flex-1 px-6 py-4">
          <Input
            id="company2-desktop"
            type="text"
            value={company2}
            onChange={(e) => setCompany2(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Company 2 name or URL..."
            className="border-0 bg-transparent text-base focus:ring-0 focus:outline-none p-0 h-auto"
            style={{
              color: '#f9f9f9',
              fontFamily: 'Inter, sans-serif'
            }}
            required
          />
        </div>

        {/* Divider */}
        <div 
          className="w-px h-8"
          style={{ backgroundColor: '#262626' }}
        />

        {/* Section Select */}
        <div className="flex-1 px-6 py-4">
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger 
              id="section-desktop"
              className="border-0 bg-transparent text-base focus:ring-0 focus:outline-none p-0 h-auto"
              style={{
                color: '#f9f9f9',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent 
              className="shadow-lg"
              style={{ 
                backgroundColor: '#1a1a1a', 
                borderColor: '#262626',
                borderRadius: '12px',
                boxShadow: '0 0 12px rgba(0,0,0,0.6)'
              }}
            >
              {sections.map((sectionOption) => (
                <SelectItem 
                  key={sectionOption} 
                  value={sectionOption}
                  className="cursor-pointer transition-colors duration-200 focus:bg-transparent data-[highlighted]:bg-transparent"
                  style={{
                    color: '#f9f9f9',
                    fontFamily: 'Inter, sans-serif',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    margin: '2px',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#facc1520'
                    e.currentTarget.style.color = '#facc15'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#f9f9f9'
                  }}
                >
                  <span className="block">{sectionOption}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Compare Button */}
        <div className="p-2">
          <Button
            type="submit"
            disabled={!company1.trim() || !company2.trim()}
            className="w-12 h-12 rounded-full p-0 transition-all duration-200 disabled:opacity-50 hover:brightness-110"
            style={{
              backgroundColor: '#facc15',
              color: '#0a0a0a',
              boxShadow: '0 2px 8px rgba(250,204,21,0.4)'
            }}
          >
            <GitCompare className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </form>
  )
}

