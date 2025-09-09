// Video Generator Component for Kateriss AI Video Generator
// Main interface for creating videos with prompt input and settings

import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon,
  CogIcon,
  SparklesIcon,
  ClockIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { 
  CreateVideoRequest,
  VideoGenerationSettings,
  DEFAULT_VIDEO_SETTINGS,
  GenerationCost,
} from '../../types/video';
import { useVideoGeneration } from '../../hooks/useVideoGeneration';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Loading } from '../ui/Loading';
import { Modal } from '../ui/Modal';
import { PromptEditor } from './PromptEditor';
import { VideoSettings } from './VideoSettings';
import { GenerationStatus } from './GenerationStatus';
import toast from 'react-hot-toast';

interface VideoGeneratorProps {
  onVideoGenerated?: (videoId: string) => void;
  className?: string;
}

export function VideoGenerator({ onVideoGenerated, className }: VideoGeneratorProps) {
  const {
    generationState,
    settings,
    isSettingsValid,
    updateSettings,
    resetSettings,
    generateVideo,
    cancelGeneration,
    calculateCost,
    enhancePrompt,
  } = useVideoGeneration();

  // Local state
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  // Calculate generation cost
  const cost = calculateCost(settings);

  // Handle form submission
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt for your video');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title for your video');
      return;
    }

    if (!isSettingsValid) {
      toast.error('Please check your video settings');
      return;
    }

    const request: CreateVideoRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      prompt: prompt.trim(),
      settings,
      tags: tags.filter(tag => tag.trim()),
    };

    try {
      await generateVideo(request);
      
      // Reset form if generation started successfully
      setPrompt('');
      setTitle('');
      setDescription('');
      setTags([]);
      
      if (onVideoGenerated) {
        onVideoGenerated(generationState.currentVideo?.id || '');
      }
    } catch (error) {
      console.error('Failed to generate video:', error);
    }
  }, [
    prompt,
    title,
    description,
    tags,
    settings,
    isSettingsValid,
    generateVideo,
    generationState.currentVideo,
    onVideoGenerated,
  ]);

  // Handle prompt enhancement
  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsEnhancingPrompt(true);
    
    try {
      const enhanced = await enhancePrompt(prompt);
      if (enhanced !== prompt) {
        setPrompt(enhanced);
        toast.success('Prompt enhanced successfully!');
      } else {
        toast.success('Prompt is already well-optimized');
      }
    } catch (error) {
      toast.error('Failed to enhance prompt');
    } finally {
      setIsEnhancingPrompt(false);
    }
  }, [prompt, enhancePrompt]);

  // Handle settings reset
  const handleResetSettings = useCallback(() => {
    resetSettings();
    toast.success('Settings reset to defaults');
  }, [resetSettings]);

  // Generate auto title from prompt
  const generateTitleFromPrompt = useCallback(() => {
    if (!prompt.trim()) return;

    const words = prompt.split(' ').slice(0, 5);
    const autoTitle = words.join(' ').replace(/[^\w\s]/gi, '');
    
    if (autoTitle) {
      setTitle(autoTitle);
      toast.success('Title generated from prompt');
    }
  }, [prompt]);

  return (
    <div className={clsx('video-generator', className)}>
      <Card variant="pink" className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#ff0080] text-white rounded-none">
                <PlayIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wide">
                  Video Generator
                </h2>
                <p className="text-gray-600 text-sm">
                  Create amazing videos with AI using Veo 3 Fast
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2"
              >
                <CogIcon className="w-4 h-4" />
                Settings
              </Button>
              
              {cost.totalCredits > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-2 border-black text-sm font-bold">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  {cost.totalCredits} credits
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
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

          {/* Video Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Title and Description */}
            <div className="space-y-4">
              <Input
                label="Video Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for your video"
                maxLength={100}
                disabled={generationState.isGenerating}
                success={title.length > 10 ? 'Good title length' : undefined}
              />
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateTitleFromPrompt}
                  disabled={!prompt.trim() || generationState.isGenerating}
                  className="text-xs"
                >
                  Generate from prompt
                </Button>
              </div>

              <Input
                label="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your video"
                maxLength={500}
                disabled={generationState.isGenerating}
              />
            </div>

            {/* Settings Preview */}
            <Card variant="default" className="h-fit">
              <CardContent>
                <h3 className="font-bold text-sm uppercase tracking-wide mb-3">
                  Current Settings
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolution:</span>
                    <span className="font-semibold">{settings.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold">{settings.duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality:</span>
                    <span className="font-semibold capitalize">{settings.quality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aspect Ratio:</span>
                    <span className="font-semibold">{settings.aspectRatio}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t-2 border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Est. Cost:</span>
                    <div className="text-right">
                      <div className="font-bold">{cost.totalCredits} credits</div>
                      <div className="text-xs text-gray-500">${cost.usdCost.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prompt Editor */}
          <PromptEditor
            value={prompt}
            onChange={setPrompt}
            onEnhance={handleEnhancePrompt}
            isEnhancing={isEnhancingPrompt}
            disabled={generationState.isGenerating}
            settings={settings}
            className="w-full"
          />

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide text-black mb-2">
              Tags (Optional)
            </label>
            <div className="flex flex-wrap gap-2 p-4 border-3 border-black bg-white shadow-[4px_4px_0px_#000]">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[#ff0080] text-white text-xs font-bold uppercase"
                >
                  {tag}
                  <button
                    onClick={() => setTags(prev => prev.filter((_, i) => i !== index))}
                    className="hover:bg-white hover:text-[#ff0080] rounded-full p-0.5"
                    disabled={generationState.isGenerating}
                  >
                    ×
                  </button>
                </span>
              ))}
              
              <input
                type="text"
                placeholder="Add tag..."
                className="flex-1 min-w-32 bg-transparent outline-none text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = e.currentTarget.value.trim();
                    if (value && !tags.includes(value) && tags.length < 10) {
                      setTags(prev => [...prev, value]);
                      e.currentTarget.value = '';
                    }
                  }
                }}
                disabled={generationState.isGenerating}
              />
            </div>
          </div>

          {/* Generation Cost Breakdown */}
          {cost.totalCredits > 0 && (
            <Card variant="default">
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <InformationCircleIcon className="w-5 h-5 text-[#ff0080]" />
                  <h3 className="font-bold text-sm uppercase tracking-wide">
                    Cost Breakdown
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Base Cost</div>
                    <div className="font-bold">{cost.baseCredits} credits</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Resolution</div>
                    <div className="font-bold">×{cost.resolutionMultiplier}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Duration</div>
                    <div className="font-bold">×{cost.durationMultiplier}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Quality</div>
                    <div className="font-bold">×{cost.qualityMultiplier}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleResetSettings}
                disabled={generationState.isGenerating}
                size="sm"
              >
                Reset Settings
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setShowPreview(true)}
                disabled={!prompt.trim() || generationState.isGenerating}
                size="sm"
              >
                Preview Settings
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {generationState.isGenerating && generationState.canCancel && (
                <Button
                  variant="outline"
                  onClick={cancelGeneration}
                  size="lg"
                  className="text-red-600 border-red-600"
                >
                  Cancel Generation
                </Button>
              )}
              
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerate}
                disabled={
                  !prompt.trim() || 
                  !title.trim() || 
                  !isSettingsValid ||
                  generationState.isGenerating
                }
                loading={generationState.isGenerating}
                className="min-w-48"
              >
                {generationState.isGenerating ? (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5" />
                    Generate Video
                  </div>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Video Generation Settings"
        size="lg"
      >
        <VideoSettings
          settings={settings}
          onChange={updateSettings}
          onReset={handleResetSettings}
          cost={cost}
          className="p-0"
        />
        
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t-2 border-gray-200">
          <Button
            variant="outline"
            onClick={() => setShowSettings(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowSettings(false)}
          >
            Apply Settings
          </Button>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Generation Preview"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">Video Details:</h3>
            <div className="bg-gray-50 p-4 border-2 border-gray-200 space-y-2">
              <div><strong>Title:</strong> {title || 'Untitled Video'}</div>
              <div><strong>Duration:</strong> {settings.duration} seconds</div>
              <div><strong>Resolution:</strong> {settings.resolution}</div>
              <div><strong>Quality:</strong> {settings.quality}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold mb-2">Prompt:</h3>
            <div className="bg-gray-50 p-4 border-2 border-gray-200">
              {prompt || 'No prompt entered'}
            </div>
          </div>
          
          <div>
            <h3 className="font-bold mb-2">Estimated Cost:</h3>
            <div className="bg-[#ff0080] text-white p-4 font-bold text-center">
              {cost.totalCredits} credits (${cost.usdCost.toFixed(2)})
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowPreview(false)}
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default VideoGenerator;