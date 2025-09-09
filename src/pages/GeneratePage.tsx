import React from 'react';
import { VideoGenerator } from '../components/video/VideoGenerator';
import { VideoQueue } from '../components/video/VideoQueue';
import { UsageTracker } from '../components/payment/UsageTracker';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

const GeneratePage: React.FC = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-5xl font-bold text-black mb-4">
            Generate <span className="text-gradient">AI Videos</span>
          </h1>
          <p className="text-xl text-gray-600 font-medium max-w-3xl">
            Transform your ideas into stunning videos using Google Veo 3 Fast AI. 
            Simply describe what you want to see and watch the magic happen.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Generation Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Generator */}
            <Card>
              <CardHeader className="border-b-3 border-gray-200 pb-6">
                <h2 className="text-2xl font-bold text-black">Create New Video</h2>
                <p className="text-gray-600 font-medium">
                  Describe your video idea and let AI bring it to life
                </p>
              </CardHeader>
              <CardContent className="p-8">
                <VideoGenerator />
              </CardContent>
            </Card>

            {/* Generation Queue */}
            <Card>
              <CardHeader className="border-b-3 border-gray-200 pb-6">
                <h2 className="text-2xl font-bold text-black">Generation Queue</h2>
                <p className="text-gray-600 font-medium">
                  Track your video generation progress in real-time
                </p>
              </CardHeader>
              <CardContent className="p-8">
                <VideoQueue />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Usage Tracker */}
            <Card variant="pink">
              <CardHeader className="border-b-3 border-primary pb-6">
                <h3 className="text-xl font-bold text-black">Usage This Month</h3>
              </CardHeader>
              <CardContent className="p-6">
                <UsageTracker />
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardHeader className="border-b-3 border-gray-200 pb-6">
                <h3 className="text-xl font-bold text-black">💡 Pro Tips</h3>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-secondary mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-bold text-black mb-1">Be Specific</div>
                      <div className="text-gray-600">Include details about setting, mood, and visual style for better results.</div>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-secondary mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-bold text-black mb-1">Use Action Words</div>
                      <div className="text-gray-600">Verbs like "walking," "dancing," or "flying" create dynamic videos.</div>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-secondary mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-bold text-black mb-1">Set the Scene</div>
                      <div className="text-gray-600">Mention lighting, weather, and time of day for atmospheric videos.</div>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-secondary mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-bold text-black mb-1">Keep It Simple</div>
                      <div className="text-gray-600">Focus on one main action or scene for clearest results.</div>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Example Prompts */}
            <Card>
              <CardHeader className="border-b-3 border-gray-200 pb-6">
                <h3 className="text-xl font-bold text-black">🎬 Example Prompts</h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 text-sm">
                  <div className="p-4 bg-gray-100 border-2 border-gray-300">
                    <div className="font-bold text-black mb-2">Nature Scene</div>
                    <div className="text-gray-700 italic">
                      "A majestic waterfall cascading down moss-covered rocks in a lush forest, 
                      with sunbeams filtering through the canopy and creating rainbow mist."
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-100 border-2 border-gray-300">
                    <div className="font-bold text-black mb-2">Urban Life</div>
                    <div className="text-gray-700 italic">
                      "Bustling city street at golden hour, with people walking past colorful 
                      storefronts, cars moving in the distance, and warm street lights beginning to glow."
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-100 border-2 border-gray-300">
                    <div className="font-bold text-black mb-2">Abstract Art</div>
                    <div className="text-gray-700 italic">
                      "Flowing liquid metal transforming into geometric shapes, with vibrant 
                      colors shifting from deep purple to electric blue against a black background."
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Links */}
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <h3 className="font-bold text-black">Need Help?</h3>
                <div className="space-y-2 text-sm">
                  <a href="/docs" className="block text-primary hover:text-accent font-medium">
                    📚 View Documentation
                  </a>
                  <a href="/examples" className="block text-primary hover:text-accent font-medium">
                    🎥 Browse Examples
                  </a>
                  <a href="/support" className="block text-primary hover:text-accent font-medium">
                    💬 Contact Support
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratePage;