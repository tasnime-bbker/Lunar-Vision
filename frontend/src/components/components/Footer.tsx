import { 
  Github, 
  Twitter, 
  Linkedin, 
  Mail, 
  Globe,
  Zap,
  Shield,
  Clock,
  Users
} from 'lucide-react'

export default function Footer() {
  return (
    <footer 
      className="border-t mt-16"
      style={{ 
        backgroundColor: '#0a0a0a',
        borderColor: '#262626'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 
              className="text-xl font-bold"
              style={{ 
                color: '#f9f9f9',
                textShadow: '0 0 10px #facc15, 0 0 20px #facc15'
              }}
            >
              <span style={{ color: '#facc15' }}>I</span>nfo-Ninja
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI-powered competitive intelligence platform that transforms business research 
              with multi-agent analysis and real-time discovery capabilities.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Features</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Competitor Analysis</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200 flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>Competitor Discovery</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Company Comparison</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200 flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Real-time Updates</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  API Reference
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  Case Studies
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors duration-200 flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Security</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="pt-8 border-t flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
          style={{ borderColor: '#262626' }}
        >
          <div className="text-sm text-gray-400">
            © 2025 Info-Ninja. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <span className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>System Operational</span>
            </span>
            <span>Built with AI Agents</span>
            <span className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Powered by Gemini</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
