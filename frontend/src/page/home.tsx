'use client'

import { Button } from "@/components/ui/button"
import { motion, useScroll, useTransform } from "framer-motion"
import { BackgroundLines } from "@/components/ui/background-lines"
import { ArrowRight, Github, Twitter } from 'lucide-react'
import Link from "next/link"

export default function Home() {
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <BackgroundLines />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-gray-800/50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-4 h-4 bg-black transform rotate-45" />
              </div>
              <span className="font-semibold">Deploify</span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#templates" className="text-sm text-gray-400 hover:text-white transition-colors">
                Templates
              </Link>
              <Link href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Button variant="outline" className="ml-4 group">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center py-32">
        <motion.div
          style={{ opacity, scale }}
          className="container mx-auto px-4 pt-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto relative z-10"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 1 }}
              className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-full"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="mb-8 inline-block"
            >
              <div className="px-4 py-1 rounded-full border border-gray-800 text-sm text-gray-400 backdrop-blur-sm">
                Deploify 2.0 is now available ✨
              </div>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
              Your complete platform for the web.
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Deploify provides the developer tools and cloud infrastructure
              to build, scale, and secure a faster, more personalized web.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 group">
                Start Deploying
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto group">
                Get a Demo
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>

          {/* Floating Elements */}
          <div className="relative mt-20">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="max-w-5xl mx-auto"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-4 shadow-2xl">
                  <pre className="text-sm text-gray-300 font-mono">
                    <code>{`$ deploify deploy
✨ Preparing your deployment...
🚀 Building and optimizing...
✅ Success! Deployed to https://your-app.deploify.app

Deployment complete in 8.2s`}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent py-8">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            >
              <div>
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">99.99%</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">150+</div>
                <div className="text-sm text-gray-400">Edge Locations</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-pink-600">5M+</div>
                <div className="text-sm text-gray-400">Developers</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600">1B+</div>
                <div className="text-sm text-gray-400">Monthly Requests</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                <div className="mb-4 text-sm text-blue-400 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mr-2" />
                  Continuous Deployment
                </div>
                <h3 className="text-xl font-semibold mb-2">From localhost to https, in seconds.</h3>
                <p className="text-gray-400 mb-4">Deploy from git or your local machine in just a few clicks.</p>
                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300 group-hover:bg-black/70 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <pre className="overflow-x-auto">
                    {`$ deploify deploy
✓ Deployed to production
  https://your-app.deploify.app`}
                  </pre>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                <div className="mb-4 text-sm text-green-400 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                  Edge Network
                </div>
                <h3 className="text-xl font-semibold mb-2">Global by default.</h3>
                <p className="text-gray-400 mb-4">Deploy to a global edge network with a single command.</p>
                <div className="bg-black/50 rounded-lg p-4 group-hover:bg-black/70 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm text-gray-400">Edge Network Status</span>
                    </div>
                    <span className="text-sm text-green-400">Operational</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-green-400/30 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl rounded-full" />
            <h2 className="text-4xl md:text-5xl font-bold mb-8 relative z-10">
              Ready to deploy?{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Start building now.
              </span>
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 group">
                Start Deploying Now
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="group">
                Contact Sales
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <div className="w-3 h-3 bg-black transform rotate-45" />
                </div>
                <span className="font-semibold">Deploify</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Building the future of web deployment.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Github className="w-5 h-5" />
                </Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Enterprise</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Guides</Link></li>
                <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">© 2024 Deploify. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

