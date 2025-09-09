import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { config } from '../config/env';

const HomePage: React.FC = () => {
  const features = [
    {
      title: 'AI-Powered Video Generation',
      description: 'Create stunning videos from text using Google Veo 3 Fast, the most advanced AI video generation technology.',
      icon: '🎬',
    },
    {
      title: 'Lightning Fast Processing',
      description: 'Generate high-quality videos in minutes, not hours. Our optimized pipeline ensures rapid turnaround.',
      icon: '⚡',
    },
    {
      title: 'Commercial Rights Included',
      description: 'Premium users get full commercial rights to use generated videos for business and marketing purposes.',
      icon: '💼',
    },
    {
      title: 'Multiple Formats',
      description: 'Export in various resolutions and formats. Perfect for social media, marketing, or professional use.',
      icon: '📱',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Marketing Director',
      company: 'TechStart',
      content: 'Kateriss has revolutionized our content creation. We generate weeks worth of social media videos in minutes.',
      avatar: '👩‍💼',
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Creative Director', 
      company: 'BrandCorp',
      content: 'The quality is incredible. Our clients cant tell the difference between AI-generated and professionally shot videos.',
      avatar: '👨‍🎨',
    },
    {
      name: 'Emma Thompson',
      role: 'Content Creator',
      company: 'Independent',
      content: 'As a solo creator, Kateriss gives me the power of a full production team. Game changer for my business.',
      avatar: '🎭',
    },
  ];

  const pricingPreview = [
    {
      name: 'Pay-per-Video',
      price: config.pricing.payPerVideo,
      period: 'per video',
      description: 'Perfect for occasional use',
      features: ['High-quality generation', '1080p resolution', 'Basic support'],
      highlighted: false,
    },
    {
      name: 'Basic',
      price: config.pricing.basicMonthly,
      period: 'per month',
      description: '20 videos included',
      features: ['Everything in Pay-per-Video', '20 videos/month', 'Priority support', 'Batch processing'],
      highlighted: false,
    },
    {
      name: 'Premium',
      price: config.pricing.premiumMonthly,
      period: 'per month',
      description: 'Unlimited + commercial rights',
      features: ['Unlimited videos', 'Commercial rights', 'API access', 'Priority processing', '24/7 support'],
      highlighted: true,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-white border-b-4 border-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl lg:text-6xl font-bold text-black leading-tight">
                Generate Stunning{' '}
                <span className="text-gradient">AI Videos</span>{' '}
                in Minutes
              </h1>
              <p className="text-xl text-gray-600 font-medium max-w-lg">
                Transform your ideas into professional videos using Google Veo 3 Fast. 
                No filming, no editing, just pure creative power.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Creating Free
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    View Pricing
                  </Button>
                </Link>
              </div>
              <div className="flex items-center space-x-8 text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-secondary"></div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-secondary"></div>
                  <span>Free trial included</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="brutal-card-pink p-8 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="aspect-video bg-gradient-to-br from-primary to-accent flex items-center justify-center border-3 border-black">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4 animate-bounce-slow">🎬</div>
                    <div className="font-bold text-xl">AI Video Magic</div>
                    <div className="text-sm opacity-90">Powered by Veo 3 Fast</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 brutal-card bg-secondary text-black p-4 font-bold text-center transform -rotate-12">
                <div className="text-2xl">⚡</div>
                <div className="text-sm">FAST</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-100 border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Why Choose <span className="text-gradient">Kateriss AI</span>?
            </h2>
            <p className="text-xl text-gray-600 font-medium max-w-3xl mx-auto">
              We combine cutting-edge AI technology with a brutally simple interface 
              to deliver the best video generation experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="h-full hover:transform hover:translate-y-[-8px] transition-all duration-300">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-black">{feature.title}</h3>
                  <p className="text-gray-600 font-medium">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Simple, <span className="text-gradient">Transparent</span> Pricing
            </h2>
            <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Choose the plan that fits your needs. No hidden fees, no surprises.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPreview.map((plan, index) => (
              <Card 
                key={index} 
                variant={plan.highlighted ? 'pink' : 'default'}
                className={`relative ${plan.highlighted ? 'transform scale-105' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="brutal-card bg-primary text-white px-4 py-2 font-bold text-sm uppercase">
                      Most Popular
                    </div>
                  </div>
                )}
                <CardContent className="p-8 text-center space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-black">{plan.name}</h3>
                    <p className="text-gray-600 font-medium">{plan.description}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-black">
                      ${plan.price}
                    </div>
                    <div className="text-gray-600 font-medium">{plan.period}</div>
                  </div>
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-secondary"></div>
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/pricing">
                    <Button 
                      variant={plan.highlighted ? 'primary' : 'outline'} 
                      size="lg" 
                      className="w-full"
                    >
                      {plan.highlighted ? 'Start Premium' : 'Choose Plan'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/pricing">
              <Button variant="ghost">
                View detailed pricing comparison →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-100 border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              What Our <span className="text-gradient">Creators</span> Say
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="h-full">
                <CardContent className="p-8 space-y-6">
                  <p className="text-gray-700 font-medium text-lg italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-bold text-black">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl lg:text-5xl font-bold">
            Ready to Create <span className="text-primary">Amazing Videos</span>?
          </h2>
          <p className="text-xl text-gray-300 font-medium max-w-2xl mx-auto">
            Join thousands of creators already using Kateriss AI to transform their ideas 
            into stunning videos. Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/generate">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-black">
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;