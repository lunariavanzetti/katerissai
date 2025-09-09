// Prompt Editor Component for Kateriss AI Video Generator
// Advanced textarea with pink highlights and AI suggestions

import React, { useState, useRef, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  LightBulbIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { VideoGenerationSettings, PromptSuggestion } from '../../types/video';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import toast from 'react-hot-toast';

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  onEnhance?: (prompt: string) => Promise<string>;
  isEnhancing?: boolean;
  disabled?: boolean;
  settings?: VideoGenerationSettings;
  maxLength?: number;
  placeholder?: string;
  className?: string;
}

// Prompt quality indicators
interface PromptQuality {
  score: number;
  issues: string[];
  suggestions: string[];
  strengths: string[];
}

// Sample prompt suggestions categorized
const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  // Style suggestions
  {
    id: 'cinematic',
    text: 'cinematic style',
    category: 'style',
    description: 'Professional movie-like quality',
    example: 'A cinematic wide shot of a sunset over mountains',
  },
  {
    id: 'vibrant',
    text: 'vibrant colors',
    category: 'style',
    description: 'Rich, saturated color palette',
    example: 'A garden with vibrant colors and blooming flowers',
  },
  {
    id: 'minimalist',
    text: 'minimalist design',
    category: 'style',
    description: 'Clean, simple composition',
    example: 'A minimalist white room with a single red chair',
  },
  
  // Technical suggestions
  {
    id: 'hd',
    text: 'high definition',
    category: 'technical',
    description: 'Enhanced clarity and detail',
    example: 'A high definition close-up of raindrops on glass',
  },
  {
    id: 'slowmotion',
    text: 'slow motion',
    category: 'technical',
    description: 'Smooth, dramatic movement',
    example: 'Slow motion waves crashing on the beach',
  },
  
  // Content suggestions
  {
    id: 'nature',
    text: 'natural environment',
    category: 'content',
    description: 'Outdoor scenes and landscapes',
    example: 'A peaceful forest with sunlight streaming through trees',
  },
  {
    id: 'abstract',
    text: 'abstract patterns',
    category: 'content',
    description: 'Non-representational visuals',
    example: 'Abstract flowing liquid patterns in gold and blue',
  },
  
  // Mood suggestions
  {
    id: 'peaceful',
    text: 'peaceful atmosphere',
    category: 'mood',
    description: 'Calm and tranquil feeling',
    example: 'A peaceful lake at dawn with mist rising',
  },
  {
    id: 'dynamic',
    text: 'dynamic movement',
    category: 'mood',
    description: 'Energy and motion',
    example: 'Dynamic city traffic with light trails at night',
  },
];

export function PromptEditor({
  value,
  onChange,
  onEnhance,
  isEnhancing = false,
  disabled = false,
  settings,
  maxLength = 500,
  placeholder = "Describe your video in detail. Be specific about what you want to see, the style, mood, and visual elements...",
  className,
}: PromptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [promptQuality, setPromptQuality] = useState<PromptQuality | null>(null);

  // Analyze prompt quality
  const analyzePrompt = useCallback((prompt: string): PromptQuality => {
    const words = prompt.trim().split(/\s+/);
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim());
    
    let score = 0;
    const issues: string[] = [];
    const suggestions: string[] = [];
    const strengths: string[] = [];

    // Length analysis
    if (words.length < 5) {
      issues.push('Too short - add more detail');
      score -= 20;
    } else if (words.length > 80) {
      issues.push('Too long - consider simplifying');
      score -= 10;
    } else if (words.length >= 15 && words.length <= 50) {
      strengths.push('Good length and detail');
      score += 15;
    }

    // Content analysis
    const hasAction = /\b(moving|flowing|dancing|flying|running|walking|swimming|rotating|spinning|falling|rising)\b/i.test(prompt);
    const hasStyle = /\b(cinematic|artistic|realistic|abstract|minimalist|vibrant|dramatic)\b/i.test(prompt);
    const hasColors = /\b(red|blue|green|yellow|orange|purple|pink|black|white|gold|silver)\b/i.test(prompt);
    const hasLighting = /\b(sunlight|moonlight|golden hour|sunset|sunrise|shadows|bright|dark|glowing)\b/i.test(prompt);
    const hasCamera = /\b(close-up|wide shot|aerial view|bird's eye|panning|zooming)\b/i.test(prompt);

    if (hasAction) {
      strengths.push('Includes movement description');
      score += 10;
    } else {
      suggestions.push('Add movement or action for more dynamic video');
    }

    if (hasStyle) {
      strengths.push('Defines visual style');
      score += 10;
    } else {
      suggestions.push('Specify visual style (cinematic, artistic, etc.)');
    }

    if (hasColors) {
      strengths.push('Mentions colors');
      score += 5;
    } else {
      suggestions.push('Add color descriptions for better visuals');
    }

    if (hasLighting) {
      strengths.push('Describes lighting');
      score += 5;
    } else {
      suggestions.push('Include lighting details (sunlight, golden hour, etc.)');
    }

    if (hasCamera) {
      strengths.push('Includes camera angle');
      score += 5;
    }

    // Avoid problematic content
    const hasProblematicWords = /\b(violence|weapon|blood|gore|nsfw|explicit)\b/i.test(prompt);
    if (hasProblematicWords) {
      issues.push('May violate content policy');
      score -= 30;
    }

    // Final score calculation
    score = Math.max(0, Math.min(100, score + 40)); // Base score of 40

    return {
      score,
      issues,
      suggestions,
      strengths,
    };
  }, []);

  // Update quality analysis when prompt changes
  useEffect(() => {
    if (value.trim()) {
      const quality = analyzePrompt(value);
      setPromptQuality(quality);
    } else {
      setPromptQuality(null);
    }
  }, [value, analyzePrompt]);

  // Handle cursor position for suggestions
  const handleCursorChange = useCallback(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  }, []);

  // Insert suggestion at cursor
  const insertSuggestion = useCallback((suggestion: PromptSuggestion) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = value;

    // Insert suggestion with proper spacing
    const beforeCursor = currentValue.substring(0, start);
    const afterCursor = currentValue.substring(end);
    
    const needsSpaceBefore = beforeCursor.length > 0 && !beforeCursor.endsWith(' ') && !beforeCursor.endsWith(',');
    const needsSpaceAfter = afterCursor.length > 0 && !afterCursor.startsWith(' ') && !afterCursor.startsWith(',');
    
    const suggestionText = `${needsSpaceBefore ? ' ' : ''}${suggestion.text}${needsSpaceAfter ? ' ' : ''}`;
    const newValue = beforeCursor + suggestionText + afterCursor;

    onChange(newValue);
    
    // Move cursor to end of inserted text
    setTimeout(() => {
      const newPosition = start + suggestionText.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);

    toast.success(`Added "${suggestion.text}"`);
  }, [value, onChange]);

  // Handle enhance prompt
  const handleEnhance = useCallback(async () => {
    if (!onEnhance || !value.trim()) return;

    try {
      const enhanced = await onEnhance(value);
      if (enhanced !== value) {
        onChange(enhanced);
        toast.success('Prompt enhanced!');
      }
    } catch (error) {
      toast.error('Failed to enhance prompt');
    }
  }, [onEnhance, value, onChange]);

  // Get quality color
  const getQualityColor = (score: number): string => {
    if (score >= 80) return 'text-[#00ff00]';
    if (score >= 60) return 'text-[#ff0080]';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Filter suggestions by category
  const filteredSuggestions = selectedCategory === 'all' 
    ? PROMPT_SUGGESTIONS 
    : PROMPT_SUGGESTIONS.filter(s => s.category === selectedCategory);

  const categories = ['all', 'style', 'technical', 'content', 'mood'];

  return (
    <div className={clsx('prompt-editor', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold uppercase tracking-wide text-black">
            Video Prompt
          </label>
          
          <div className="flex items-center gap-2">
            {/* Quality Score */}
            {promptQuality && (
              <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 border-2 border-gray-300 text-xs">
                <span className="text-gray-600">Quality:</span>
                <span className={clsx('font-bold', getQualityColor(promptQuality.score))}>
                  {promptQuality.score}/100
                </span>
              </div>
            )}

            {/* Character Count */}
            <div className={clsx(
              'text-xs px-2 py-1 border-2 font-bold',
              value.length > maxLength * 0.9
                ? 'bg-red-100 border-red-500 text-red-700'
                : value.length > maxLength * 0.7
                ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                : 'bg-gray-100 border-gray-300 text-gray-600'
            )}>
              {value.length}/{maxLength}
            </div>

            {/* Suggestions Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="flex items-center gap-1"
            >
              <LightBulbIcon className="w-4 h-4" />
              Suggestions
            </Button>

            {/* Enhance Button */}
            {onEnhance && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleEnhance}
                disabled={!value.trim() || isEnhancing || disabled}
                loading={isEnhancing}
                className="flex items-center gap-1"
              >
                <SparklesIcon className="w-4 h-4" />
                Enhance
              </Button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onSelect={handleCursorChange}
            onKeyUp={handleCursorChange}
            placeholder={placeholder}
            rows={6}
            maxLength={maxLength}
            disabled={disabled || isEnhancing}
            className={clsx(
              'resize-y min-h-32',
              isEnhancing && 'animate-pulse',
              promptQuality && promptQuality.score >= 80 && 'border-[#00ff00] shadow-[4px_4px_0px_#00ff00]',
              promptQuality && promptQuality.score < 40 && 'border-red-500 shadow-[4px_4px_0px_#ff0000]'
            )}
          />

          {/* Enhancement Loading Overlay */}
          {isEnhancing && (
            <div className="absolute inset-0 bg-[#ff0080]/10 flex items-center justify-center border-3 border-[#ff0080]">
              <div className="bg-white p-3 border-3 border-[#ff0080] flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#ff0080] border-t-transparent rounded-full animate-spin" />
                <span className="font-bold text-[#ff0080]">Enhancing prompt...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quality Analysis */}
        <AnimatePresence>
          {promptQuality && value.trim() && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-3 border-gray-300 bg-gray-50 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <InformationCircleIcon className="w-5 h-5 text-[#ff0080]" />
                <h3 className="font-bold text-sm uppercase">Prompt Analysis</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {/* Strengths */}
                {promptQuality.strengths.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[#00ff00] mb-2 flex items-center gap-1">
                      <CheckIcon className="w-4 h-4" />
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {promptQuality.strengths.map((strength, index) => (
                        <li key={index} className="text-gray-700 text-xs">
                          • {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggestions */}
                {promptQuality.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[#ff0080] mb-2 flex items-center gap-1">
                      <LightBulbIcon className="w-4 h-4" />
                      Suggestions
                    </h4>
                    <ul className="space-y-1">
                      {promptQuality.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-gray-700 text-xs">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Issues */}
                {promptQuality.issues.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-500 mb-2 flex items-center gap-1">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      Issues
                    </h4>
                    <ul className="space-y-1">
                      {promptQuality.issues.map((issue, index) => (
                        <li key={index} className="text-gray-700 text-xs">
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions Panel */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-3 border-[#ff0080] bg-white"
            >
              <div className="p-4 border-b-3 border-[#ff0080] bg-[#ff0080] text-white">
                <h3 className="font-bold uppercase tracking-wide">Prompt Suggestions</h3>
                <p className="text-sm opacity-90">Click any suggestion to add it to your prompt</p>
              </div>

              <div className="p-4">
                {/* Category Tabs */}
                <div className="flex gap-1 mb-4 border-3 border-black">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={clsx(
                        'px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors border-r-3 border-black last:border-r-0',
                        selectedCategory === category
                          ? 'bg-[#ff0080] text-white'
                          : 'bg-white hover:bg-gray-100'
                      )}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                {/* Suggestions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => insertSuggestion(suggestion)}
                      disabled={disabled}
                      className="text-left p-3 border-2 border-gray-300 hover:border-[#ff0080] hover:bg-[#ff0080]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-semibold text-sm text-[#ff0080] mb-1">
                        {suggestion.text}
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {suggestion.description}
                      </div>
                      <div className="text-xs text-gray-500 italic">
                        Example: {suggestion.example}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings-based Tips */}
        {settings && (
          <div className="text-xs text-gray-500 bg-gray-50 p-3 border-2 border-gray-200">
            <strong>Tip:</strong> For {settings.resolution} at {settings.duration}s duration, 
            {settings.quality === 'high' && ' detailed descriptions work best for high quality.'}
            {settings.quality === 'fast' && ' simple, clear descriptions are recommended for fast generation.'}
            {settings.duration <= 5 && ' focus on a single action or scene for short videos.'}
            {settings.duration > 20 && ' consider describing a sequence of events for longer videos.'}
          </div>
        )}
      </div>
    </div>
  );
}

export default PromptEditor;