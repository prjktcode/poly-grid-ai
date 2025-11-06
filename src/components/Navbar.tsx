import { NavLink } from '@/components/NavLink'
import { WalletConnect } from '@/components/WalletConnect'
import { Database, Upload, Home } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2 text-xl font-bold">
              <Database className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                PolyGradient
              </span>
            </NavLink>
            
            <div className="hidden md:flex items-center gap-6">
              <NavLink
                to="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-primary font-medium"
              >
                <Home className="h-4 w-4 inline mr-2" />
                Home
              </NavLink>
              <NavLink
                to="/marketplace"
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-primary font-medium"
              >
                <Database className="h-4 w-4 inline mr-2" />
                Marketplace
              </NavLink>
              <NavLink
                to="/upload"
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="text-primary font-medium"
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Upload
              </NavLink>
            </div>
          </div>

          <WalletConnect />
        </div>
      </div>
    </nav>
  )
}
