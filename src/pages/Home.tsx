import { Button } from '@/components/ui/button'
import { Brain, Database as DatabaseIcon, Shield, Zap, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroBg from '@/assets/hero-bg.jpg'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative container mx-auto px-4 py-20 md:py-32 overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
        <div className="relative max-w-4xl mx-auto text-center space-y-8 z-10">
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm">
            <Zap className="h-4 w-4 text-accent" />
            <span>Powered by Ethereum Sepolia</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            The Decentralized
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
              AI Marketplace
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Buy, sell, and share AI models and datasets on-chain. Everything is transparent, 
            immutable, and owned by the creators.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link to="/marketplace">
              <Button variant="hero" size="lg" className="gap-2">
                Explore Marketplace
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/upload">
              <Button variant="accent" size="lg" className="gap-2">
                List Your Asset
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-2xl hover:border-primary/50 transition-all">
            <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI Models</h3>
            <p className="text-muted-foreground">
              Browse and purchase cutting-edge AI models trained by researchers worldwide.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl hover:border-accent/50 transition-all">
            <div className="h-12 w-12 rounded-lg gradient-accent flex items-center justify-center mb-4">
              <DatabaseIcon className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Premium Datasets</h3>
            <p className="text-muted-foreground">
              Access high-quality datasets for training and research purposes.
            </p>
          </div>

          <div className="glass-card p-8 rounded-2xl hover:border-primary/50 transition-all">
            <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Secure & Transparent</h3>
            <p className="text-muted-foreground">
              All transactions are recorded on-chain with IPFS storage for assets.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="glass-card p-12 rounded-2xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1,234+</div>
              <div className="text-muted-foreground">AI Models</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">5,678+</div>
              <div className="text-muted-foreground">Datasets</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">12,345+</div>
              <div className="text-muted-foreground">Transactions</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
