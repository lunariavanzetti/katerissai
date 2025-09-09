// Video Settings Component for Kateriss AI Video Generator
// Generation settings panel with pink styling

import React, { useState } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import {
  Cog6ToothIcon,
  InformationCircleIcon,
  SparklesIcon,
  ClockIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { 
  VideoGenerationSettings, 
  DEFAULT_VIDEO_SETTINGS,
  GenerationCost,
  VideoResolution,
  VideoDuration,
  VideoQuality,
  VideoFormat,
} from '../../types/video';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';

interface VideoSettingsProps {
  settings: VideoGenerationSettings;
  onChange: (settings: Partial<VideoGenerationSettings>) => void;
  onReset?: () => void;
  cost?: GenerationCost;
  disabled?: boolean;
  className?: string;
}

export function VideoSettings({
  settings,
  onChange,
  onReset,
  cost,
  disabled = false,
  className,
}: VideoSettingsProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'cost'>('basic');

  // Helper function to update settings
  const updateSetting = <K extends keyof VideoGenerationSettings>(
    key: K, 
    value: VideoGenerationSettings[K]
  ) => {
    onChange({ [key]: value });
  };

  // Resolution options with descriptions
  const resolutionOptions: Array<{
    value: VideoResolution;
    label: string;
    description: string;
    recommended?: boolean;
  }> = [
    {
      value: '480p',
      label: '480p',
      description: 'Fast generation, smaller file size',
    },
    {
      value: '720p',
      label: '720p',
      description: 'Good quality, balanced performance',
      recommended: true,
    },
    {
      value: '1080p',
      label: '1080p',
      description: 'High quality, slower generation',
    },
  ];

  // Duration options
  const durationOptions: Array<{
    value: VideoDuration;
    label: string;
    description: string;
  }> = [
    {
      value: 5,
      label: '5 seconds',
      description: 'Quick clips and animations',
    },
    {
      value: 10,
      label: '10 seconds',
      description: 'Standard short videos',
    },
    {
      value: 30,
      label: '30 seconds',
      description: 'Extended content (premium)',
    },
  ];

  // Quality options
  const qualityOptions: Array<{
    value: VideoQuality;
    label: string;
    description: string;
    icon: React.ElementType;
  }> = [
    {
      value: 'fast',
      label: 'Fast',
      description: 'Quick generation with good quality',
      icon: SparklesIcon,
    },
    {
      value: 'balanced',
      label: 'Balanced',
      description: 'Optimal quality-speed balance',
      icon: AdjustmentsHorizontalIcon,
    },
    {
      value: 'high',
      label: 'High',
      description: 'Maximum quality, slower generation',
      icon: PhotoIcon,
    },
  ];

  return (
    <div className={clsx('video-settings', className)}>
      <Card variant="pink">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#ff0080] text-white">
                <Cog6ToothIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wide">
                  Video Settings
                </h2>
                <p className="text-gray-600 text-sm">
                  Configure your video generation parameters
                </p>
              </div>
            </div>

            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                disabled={disabled}
                className="flex items-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Tab Navigation */}
          <div className="flex border-3 border-black mb-6">
            {[
              { id: 'basic', label: 'Basic', icon: Cog6ToothIcon },
              { id: 'advanced', label: 'Advanced', icon: AdjustmentsHorizontalIcon },
              { id: 'cost', label: 'Cost', icon: InformationCircleIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                disabled={disabled}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-3 px-4 font-bold text-sm uppercase transition-colors border-r-3 border-black last:border-r-0',
                  activeTab === id
                    ? 'bg-[#ff0080] text-white'
                    : 'bg-white hover:bg-gray-100 disabled:hover:bg-white',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Basic Settings Tab */}
          {activeTab === 'basic' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Resolution */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-black mb-3">
                  Resolution
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {resolutionOptions.map((option) => (
                    <label
                      key={option.value}
                      className={clsx(
                        'relative p-4 border-3 cursor-pointer transition-colors',
                        settings.resolution === option.value
                          ? 'bg-[#ff0080] text-white border-[#ff0080]'
                          : 'bg-white border-black hover:bg-gray-100',
                        disabled && 'opacity-50 cursor-not-allowed hover:bg-white'
                      )}
                    >
                      <input
                        type="radio"
                        name="resolution"
                        value={option.value}
                        checked={settings.resolution === option.value}
                        onChange={(e) => updateSetting('resolution', e.target.value as VideoResolution)}
                        disabled={disabled}
                        className="sr-only"
                      />
                      
                      <div className="text-center">
                        <div className="font-bold text-lg mb-1">{option.label}</div>
                        <div className="text-xs opacity-90">{option.description}</div>
                      </div>
                      
                      {option.recommended && (
                        <div className="absolute -top-2 -right-2 bg-[#00ff00] text-black px-2 py-1 text-xs font-bold border-2 border-black">
                          RECOMMENDED
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-black mb-3">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {durationOptions.map((option) => (
                    <label
                      key={option.value}
                      className={clsx(
                        'p-4 border-3 cursor-pointer transition-colors',
                        settings.duration === option.value
                          ? 'bg-[#ff0080] text-white border-[#ff0080]'
                          : 'bg-white border-black hover:bg-gray-100',
                        disabled && 'opacity-50 cursor-not-allowed hover:bg-white'
                      )}
                    >
                      <input
                        type="radio"
                        name="duration"
                        value={option.value}
                        checked={settings.duration === option.value}
                        onChange={(e) => updateSetting('duration', Number(e.target.value) as VideoDuration)}
                        disabled={disabled}
                        className="sr-only"
                      />
                      
                      <div className="text-center">
                        <div className="font-bold text-lg mb-1">{option.label}</div>
                        <div className="text-xs opacity-90">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-black mb-3">
                  Quality
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {qualityOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <label
                        key={option.value}
                        className={clsx(
                          'p-4 border-3 cursor-pointer transition-colors',
                          settings.quality === option.value
                            ? 'bg-[#ff0080] text-white border-[#ff0080]'
                            : 'bg-white border-black hover:bg-gray-100',
                          disabled && 'opacity-50 cursor-not-allowed hover:bg-white'
                        )}
                      >
                        <input
                          type="radio"
                          name="quality"
                          value={option.value}
                          checked={settings.quality === option.value}
                          onChange={(e) => updateSetting('quality', e.target.value as VideoQuality)}
                          disabled={disabled}
                          className="sr-only"
                        />
                        
                        <div className="text-center">
                          <Icon className="w-6 h-6 mx-auto mb-2" />
                          <div className="font-bold mb-1">{option.label}</div>
                          <div className="text-xs opacity-90">{option.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-black mb-3">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: '16:9', label: '16:9', description: 'Widescreen (YouTube, TV)' },
                    { value: '9:16', label: '9:16', description: 'Vertical (TikTok, Stories)' },
                    { value: '1:1', label: '1:1', description: 'Square (Instagram)' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={clsx(
                        'p-4 border-3 cursor-pointer transition-colors',
                        settings.aspectRatio === option.value
                          ? 'bg-[#ff0080] text-white border-[#ff0080]'
                          : 'bg-white border-black hover:bg-gray-100',
                        disabled && 'opacity-50 cursor-not-allowed hover:bg-white'
                      )}
                    >
                      <input
                        type="radio"
                        name="aspectRatio"
                        value={option.value}
                        checked={settings.aspectRatio === option.value}
                        onChange={(e) => updateSetting('aspectRatio', e.target.value as any)}
                        disabled={disabled}
                        className="sr-only"
                      />
                      
                      <div className="text-center">
                        <div className="font-bold text-lg mb-1">{option.label}</div>
                        <div className="text-xs opacity-90">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Advanced Settings Tab */}
          {activeTab === 'advanced' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Format */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-black mb-3">
                  Output Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'mp4', label: 'MP4', description: 'Universal compatibility' },
                    { value: 'webm', label: 'WebM', description: 'Smaller file size' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={clsx(
                        'p-4 border-3 cursor-pointer transition-colors',
                        settings.format === option.value
                          ? 'bg-[#ff0080] text-white border-[#ff0080]'
                          : 'bg-white border-black hover:bg-gray-100',
                        disabled && 'opacity-50 cursor-not-allowed hover:bg-white'
                      )}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={option.value}
                        checked={settings.format === option.value}
                        onChange={(e) => updateSetting('format', e.target.value as VideoFormat)}
                        disabled={disabled}
                        className="sr-only"
                      />
                      
                      <div className="text-center">
                        <div className="font-bold text-lg mb-1">{option.label}</div>
                        <div className="text-xs opacity-90">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Guidance Scale */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide text-black mb-3">
                  Guidance Scale: {settings.guidanceScale}
                </label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={settings.guidanceScale}
                    onChange={(e) => updateSetting('guidanceScale', Number(e.target.value))}
                    disabled={disabled}
                    className="w-full h-3 bg-gray-200 border-3 border-black appearance-none cursor-pointer
                               [&::-webkit-slider-thumb]:appearance-none
                               [&::-webkit-slider-thumb]:w-6
                               [&::-webkit-slider-thumb]:h-6
                               [&::-webkit-slider-thumb]:bg-[#ff0080]
                               [&::-webkit-slider-thumb]:border-3
                               [&::-webkit-slider-thumb]:border-white
                               [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Creative (1)</span>
                    <span>Balanced (7.5)</span>
                    <span>Precise (20)</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Higher values follow the prompt more strictly, lower values allow more creativity.
                  </p>
                </div>
              </div>

              {/* Seed */}
              <div>
                <Input
                  label="Seed (Optional)"
                  type="number"
                  value={settings.seed || ''}
                  onChange={(e) => updateSetting('seed', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Leave empty for random"
                  disabled={disabled}
                  helperText="Use the same seed to reproduce similar results"
                />
              </div>

              {/* Negative Prompt */}
              <div>
                <Input
                  label="Negative Prompt (Optional)"
                  value={settings.negativePrompt}
                  onChange={(e) => updateSetting('negativePrompt', e.target.value)}
                  placeholder="Describe what you don't want to see..."
                  disabled={disabled}
                  helperText="Helps avoid unwanted elements in the video"
                />
              </div>

              {/* Enhancement Options */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wide">Enhancement Options</h3>
                
                <label className="flex items-center gap-3 p-4 border-3 border-gray-300 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={settings.enhancePrompt}
                    onChange={(e) => updateSetting('enhancePrompt', e.target.checked)}
                    disabled={disabled}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="font-semibold">Auto-enhance Prompt</div>
                    <div className="text-sm text-gray-600">
                      Automatically improve prompt with AI suggestions
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-3 border-gray-300 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={settings.enableUpscaling}
                    onChange={(e) => updateSetting('enableUpscaling', e.target.checked)}
                    disabled={disabled}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="font-semibold">Enable Upscaling</div>
                    <div className="text-sm text-gray-600">
                      Enhance resolution using AI upscaling (costs extra credits)
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-3 border-gray-300 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={settings.enableStabilization}
                    onChange={(e) => updateSetting('enableStabilization', e.target.checked)}
                    disabled={disabled}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="font-semibold">Video Stabilization</div>
                    <div className="text-sm text-gray-600">
                      Reduce shake and improve smoothness
                    </div>
                  </div>
                </label>
              </div>
            </motion.div>
          )}

          {/* Cost Tab */}
          {activeTab === 'cost' && cost && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Cost Breakdown */}
              <Card variant="default">
                <CardHeader>
                  <h3 className="font-bold text-lg">Cost Breakdown</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Base Cost:</span>
                      <span className="font-bold">{cost.baseCredits} credits</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Resolution Multiplier ({settings.resolution}):</span>
                      <span className="font-bold">×{cost.resolutionMultiplier}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Duration Multiplier ({settings.duration}s):</span>
                      <span className="font-bold">×{cost.durationMultiplier}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Quality Multiplier ({settings.quality}):</span>
                      <span className="font-bold">×{cost.qualityMultiplier}</span>
                    </div>

                    {settings.enableUpscaling && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Upscaling:</span>
                        <span className="font-bold text-[#ff0080]">+50% credits</span>
                      </div>
                    )}
                    
                    <div className="border-t-3 border-black pt-4">
                      <div className="flex justify-between items-center text-xl">
                        <span className="font-bold">Total Cost:</span>
                        <div className="text-right">
                          <div className="font-bold text-[#ff0080]">{cost.totalCredits} credits</div>
                          <div className="text-sm text-gray-600">${cost.usdCost.toFixed(2)} USD</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Optimization Tips */}
              <Card variant="default">
                <CardHeader>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <InformationCircleIcon className="w-5 h-5 text-[#ff0080]" />
                    Cost Optimization Tips
                  </h3>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff0080] font-bold">•</span>
                      <span>Use 720p resolution for best quality-cost balance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff0080] font-bold">•</span>
                      <span>Start with 5-10 second videos to test prompts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff0080] font-bold">•</span>
                      <span>"Fast" quality uses fewer credits than "High"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff0080] font-bold">•</span>
                      <span>Disable upscaling unless specifically needed</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default VideoSettings;