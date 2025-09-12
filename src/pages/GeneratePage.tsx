import React from 'react';
import { SimpleVideoGenerator } from '../components/video/SimpleVideoGenerator';
import { VideoQueue } from '../components/video/VideoQueue';
import { UsageTracker } from '../components/payment/UsageTracker';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

const GeneratePage: React.FC = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Simplified Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent dark:from-green-400 dark:to-green-300 mb-6">
            AI Video Studio ✨
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-medium max-w-2xl mx-auto">
            Turn your imagination into reality with Google's Veo 3 Fast AI
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Generation Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Simplified Video Generator */}
            <SimpleVideoGenerator />

            {/* Generation Queue */}
            <Card>
              <CardHeader className="border-b-3 border-gray-200 dark:border-gray-700 pb-6">
                <h2 className="text-2xl font-bold text-black dark:text-white">Your Videos</h2>
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  Track progress and manage your creations
                </p>
              </CardHeader>
              <CardContent className="p-8">
                <VideoQueue />
              </CardContent>
            </Card>
          </div>

          {/* Compact Sidebar */}
          <div className="space-y-6">
            {/* Usage Tracker */}
            <Card variant="pink">
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-black dark:text-white mb-4">📊 Usage</h3>
                <UsageTracker />
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-black dark:text-white mb-4">💡 Tips</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="font-bold text-black dark:text-white mb-1">Be Specific</div>
                    <div className="text-gray-600 dark:text-gray-400">Include mood, lighting, and style details</div>
                  </div>
                  <div>
                    <div className="font-bold text-black dark:text-white mb-1">Use Action</div>
                    <div className="text-gray-600 dark:text-gray-400">"Walking", "flying", "dancing" create movement</div>
                  </div>
                  <div>
                    <div className="font-bold text-black dark:text-white mb-1">Keep Simple</div>
                    <div className="text-gray-600 dark:text-gray-400">Focus on one main scene or action</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Examples */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-bold text-black dark:text-white mb-4">🎬 Examples</h3>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="font-bold mb-1">Nature:</div>
                    <div className="text-gray-700 dark:text-gray-300 italic">
                      "Sunset over ocean waves with seagulls flying"
                    </div>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="font-bold mb-1">Urban:</div>
                    <div className="text-gray-700 dark:text-gray-300 italic">
                      "Busy street at night with neon reflections"
                    </div>
                  </div>
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="font-bold mb-1">Abstract:</div>
                    <div className="text-gray-700 dark:text-gray-300 italic">
                      "Colorful paint mixing in slow motion"
                    </div>
                  </div>
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