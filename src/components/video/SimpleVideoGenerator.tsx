// Simplified Video Generator Component - Clean and Easy to Use
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, Cog6ToothIcon, PlayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// Components
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { VideoSettings } from './VideoSettings';
import { GenerationStatus } from './GenerationStatus';

// Hooks
import { useVideoGeneration } from '../../hooks/useVideoGeneration';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuthContext } from '../../contexts/AuthContext';

// Types
import type { CreateVideoRequest } from '../../types/video';

interface SimpleVideoGeneratorProps {
  className?: string;
  onVideoGenerated?: (videoId: string) => void;
}

export const SimpleVideoGenerator: React.FC<SimpleVideoGeneratorProps> = ({
  className,
  onVideoGenerated,
}) => {
  // Hooks
  const { user, loading: authLoading } = useAuthContext();
  const {
    generationState,
    settings,
    updateSettings,
    resetSettings,
    generateVideo,
    cancelGeneration,
    calculateCost,
    isSettingsValid,
  } = useVideoGeneration();

  const { hasActiveSubscription, canGenerateVideo } = useSubscription();
  
  // Debug logging
  console.log('🔧 SimpleVideoGenerator render - auth state:', { 
    user: user?.email, 
    userId: user?.id, 
    authLoading, 
    hasActiveSubscription, 
    canGenerateVideo 
  });

  // Local state
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Calculate cost
  const cost = calculateCost();

  // Handle generation
  const handleGenerate = useCallback(async () => {
    console.log('🎬 handleGenerate called');
    
    if (!prompt.trim()) {
      toast.error('Please describe what video you want to create');
      return;
    }

    if (!title.trim()) {
      toast.error('Please give your video a title');
      return;
    }

    if (!hasActiveSubscription && !canGenerateVideo) {
      toast.error('Please upgrade your plan to generate videos');
      return;
    }
    
    console.log('🔧 About to call generateVideo with subscription status:', { hasActiveSubscription, canGenerateVideo });

    const request: CreateVideoRequest = {
      title: title.trim(),
      prompt: prompt.trim(),
      settings,
    };

    try {
      await generateVideo(request);
      onVideoGenerated?.(generationState.currentVideo?.id || '');
    } catch (error) {
      console.error('Generation failed:', error);
    }
  }, [
    prompt,
    title,
    settings,
    generateVideo,
    hasActiveSubscription,
    canGenerateVideo,
    onVideoGenerated,
    generationState.currentVideo?.id,
  ]);

  // Auto-generate title from prompt
  const generateTitleFromPrompt = useCallback(() => {
    if (!prompt.trim()) return;
    
    const words = prompt.trim().split(' ').slice(0, 6);
    const autoTitle = words.join(' ').replace(/[^\w\s]/gi, '');
    
    if (autoTitle) {
      setTitle(autoTitle.charAt(0).toUpperCase() + autoTitle.slice(1));
      toast.success('Title generated!');
    }
  }, [prompt]);

  // Don't render if auth is still loading
  if (authLoading) {
    return (
      <div className={clsx('w-full max-w-3xl mx-auto', className)}>
        <Card variant="pink" className="overflow-visible">
          <CardContent className="space-y-6">
            <div className="text-center py-12">
              <div className="animate-pulse text-gray-500 dark:text-gray-400">
                Loading your workspace...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={clsx('w-full max-w-3xl mx-auto', className)}>
      <Card variant="pink" className="overflow-visible">
        <CardContent className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent dark:from-green-400 dark:to-green-300">
              Create Your Video ✨
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Describe your vision and watch it come to life
            </p>
          </div>

          {/* Generation Status */}
          <AnimatePresence>
            {generationState.isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <GenerationStatus
                  video={generationState.currentVideo}
                  progress={generationState.progress}
                  stage={generationState.stage}
                  estimatedTimeRemaining={generationState.estimatedTimeRemaining}
                  onCancel={generationState.canCancel ? cancelGeneration : undefined}
                  className="mb-6"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settings Preview - Moved to top */}
          <div className="bg-gradient-to-r from-pink-50/80 to-green-50/80 dark:from-pink-900/30 dark:to-green-900/30 rounded-xl border-2 border-black dark:border-gray-600 p-4 shadow-brutal">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 dark:text-gray-400">Quality:</span>
                  <span className="text-primary dark:text-green-400 capitalize font-bold">{settings.quality}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 dark:text-gray-400">Length:</span>
                  <span className="text-primary dark:text-green-400 font-bold">{settings.duration}s</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 dark:text-gray-400">Resolution:</span>
                  <span className="text-primary dark:text-green-400 font-bold">{settings.resolution}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 dark:text-gray-400">Format:</span>
                  <span className="text-primary dark:text-green-400 font-bold">{settings.aspectRatio}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cost</div>
                  <div className="font-bold text-primary dark:text-green-400">{cost.totalCredits} credits</div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedSettings(true)}
                  disabled={generationState.isGenerating}
                  className="text-xs"
                >
                  <Cog6ToothIcon className="w-4 h-4 mr-1" />
                  Customize
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Aspect Ratio Selection - New section */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
              Video Format 📱
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '16:9', label: '16:9', description: 'Landscape (YouTube)' },
                { value: '9:16', label: '9:16', description: 'Portrait (TikTok)' },
                { value: '1:1', label: '1:1', description: 'Square (Instagram)' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={clsx(
                    'p-3 border-3 cursor-pointer transition-colors rounded-lg',
                    settings.aspectRatio === option.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white dark:bg-gray-800 border-black dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700',
                    generationState.isGenerating && 'opacity-50 cursor-not-allowed hover:bg-white dark:hover:bg-gray-800'
                  )}
                >
                  <input
                    type="radio"
                    name="aspectRatio"
                    value={option.value}
                    checked={settings.aspectRatio === option.value}
                    onChange={(e) => updateSettings({ aspectRatio: e.target.value as any })}
                    disabled={generationState.isGenerating}
                    className="sr-only"
                  />

                  <div className="text-center">
                    <div className="font-bold text-sm mb-1">{option.label}</div>
                    <div className="text-xs opacity-90">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Main Input - Moved to bottom */}
          <div className="space-y-4">
            {/* Video Description */}
            <div className="relative">
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
                What video do you want to create? 🎬
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A majestic lion running through tall grass at sunset, cinematic style..."
                rows={4}
                maxLength={500}
                disabled={generationState.isGenerating}
                className="w-full px-4 py-3 border-3 border-black dark:border-gray-600 rounded-lg font-medium bg-white dark:bg-gray-800 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary dark:focus:border-green-400 focus:outline-none transition-colors shadow-brutal resize-none"
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                {prompt.length}/500
              </div>
            </div>

            {/* Video Title */}
            <div className="flex gap-2">
              <Input
                label="Video Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Amazing Video"
                maxLength={100}
                disabled={generationState.isGenerating}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={generateTitleFromPrompt}
                disabled={!prompt.trim() || generationState.isGenerating}
                className="mt-7 px-3"
                title="Generate title from description"
              >
                ✨
              </Button>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              disabled={
                !prompt.trim() ||
                !title.trim() ||
                generationState.isGenerating ||
                !isSettingsValid ||
                (!hasActiveSubscription && !canGenerateVideo)
              }
              className="min-w-[250px] font-bold text-xl px-12 py-4 bg-gradient-to-r from-primary to-accent hover:shadow-brutal-lg hover:transform hover:-translate-y-1 transition-all duration-200 text-white"
            >
              {generationState.isGenerating ? (
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Creating Magic...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PlayIcon className="w-6 h-6" />
                  Create Video
                </div>
              )}
            </Button>
          </div>

          {/* Subscription Notice */}
          {!hasActiveSubscription && !canGenerateVideo && (
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-400 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                💡 Upgrade to a paid plan to generate videos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Settings Modal */}
      <Modal
        isOpen={showAdvancedSettings}
        onClose={() => setShowAdvancedSettings(false)}
        title="Video Settings"
        size="lg"
      >
        <VideoSettings
          settings={settings}
          onChange={updateSettings}
          onReset={() => {
            resetSettings();
            toast.success('Settings reset to defaults');
          }}
          cost={cost}
          className="p-0"
        />
        
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedSettings(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowAdvancedSettings(false)}
          >
            Apply Settings
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SimpleVideoGenerator;