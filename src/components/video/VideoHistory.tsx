// Video History Component for Kateriss AI Video Generator
// Grid layout with brutal cards showing user's video library

import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Squares2X2Icon,
  ListBulletIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  HeartIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { useVideoLibrary } from '../../hooks/useVideoLibrary';
import { VideoFilter, VideoSortOptions } from '../../types/video';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Loading } from '../ui/Loading';
import { Modal } from '../ui/Modal';
import { VideoPreview } from './VideoPreview';
import toast from 'react-hot-toast';

interface VideoHistoryProps {
  className?: string;
}

export function VideoHistory({ className }: VideoHistoryProps) {
  const {
    videos,
    filteredVideos,
    stats,
    libraryState,
    isLoading,
    error,
    refreshLibrary,
    updateVideo,
    deleteVideo,
    deleteVideos,
    toggleFavorite,
    selectVideo,
    deselectVideo,
    selectAll,
    deselectAll,
    toggleSelection,
    setSelectionMode,
    updateFilter,
    updateSort,
    clearFilters,
    setViewMode,
    searchVideos,
    downloadSelected,
    exportSelected,
    goToPage,
    nextPage,
    previousPage,
  } = useVideoLibrary();

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    searchVideos(query);
  }, [searchVideos]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    const selectedIds = Array.from(libraryState.selectedVideos);
    if (selectedIds.length === 0) {
      toast.error('No videos selected');
      return;
    }

    if (window.confirm(`Delete ${selectedIds.length} selected videos? This cannot be undone.`)) {
      await deleteVideos(selectedIds);
      setShowBulkActions(false);
    }
  }, [libraryState.selectedVideos, deleteVideos]);

  // Handle bulk favorite
  const handleBulkFavorite = useCallback(async () => {
    const selectedIds = Array.from(libraryState.selectedVideos);
    if (selectedIds.length === 0) {
      toast.error('No videos selected');
      return;
    }

    for (const videoId of selectedIds) {
      await toggleFavorite(videoId);
    }
    
    toast.success(`Updated ${selectedIds.length} videos`);
    setShowBulkActions(false);
  }, [libraryState.selectedVideos, toggleFavorite]);

  // Sort options
  const sortOptions: Array<{ label: string; value: VideoSortOptions }> = [
    { label: 'Newest First', value: { field: 'createdAt', direction: 'desc' } },
    { label: 'Oldest First', value: { field: 'createdAt', direction: 'asc' } },
    { label: 'Title A-Z', value: { field: 'title', direction: 'asc' } },
    { label: 'Title Z-A', value: { field: 'title', direction: 'desc' } },
    { label: 'Most Viewed', value: { field: 'viewCount', direction: 'desc' } },
    { label: 'Most Downloaded', value: { field: 'downloadCount', direction: 'desc' } },
  ];

  if (error) {
    return (
      <div className={clsx('video-history-error text-center py-12', className)}>
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-2">Failed to load videos</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={refreshLibrary}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className={clsx('video-history', className)}>
      {/* Header */}
      <Card variant="pink" className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-wide">Video Library</h2>
              <p className="text-gray-600">
                {stats ? `${stats.totalVideos} videos • ${stats.completedVideos} completed` : 'Loading...'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Selection Mode Toggle */}
              <Button
                variant={libraryState.isSelectionMode ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectionMode(!libraryState.isSelectionMode)}
                className="flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Select
              </Button>

              {/* View Mode Toggle */}
              <div className="flex border-3 border-black">
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'p-2 border-r-3 border-black transition-colors',
                    libraryState.viewMode === 'grid'
                      ? 'bg-[#ff0080] text-white'
                      : 'bg-white hover:bg-gray-100'
                  )}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'p-2 transition-colors',
                    libraryState.viewMode === 'list'
                      ? 'bg-[#ff0080] text-white'
                      : 'bg-white hover:bg-gray-100'
                  )}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Filters */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <FunnelIcon className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Input
                placeholder="Search videos by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pr-10"
              />
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            {/* Sort */}
            <select
              value={`${libraryState.sort.field}-${libraryState.sort.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                updateSort({ 
                  field: field as any, 
                  direction: direction as 'asc' | 'desc' 
                });
              }}
              className="px-4 py-4 bg-white border-3 border-black font-bold text-sm focus:outline-none focus:border-[#ff0080]"
            >
              {sortOptions.map((option) => (
                <option 
                  key={`${option.value.field}-${option.value.direction}`}
                  value={`${option.value.field}-${option.value.direction}`}
                >
                  {option.label}
                </option>
              ))}
            </select>

            {/* Refresh */}
            <Button
              variant="outline"
              size="md"
              onClick={refreshLibrary}
              disabled={isLoading}
              loading={isLoading}
            >
              Refresh
            </Button>
          </div>

          {/* Selection Actions */}
          <AnimatePresence>
            {libraryState.isSelectionMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-4 bg-[#ff0080] text-white border-3 border-black"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-bold">
                      {libraryState.selectedVideos.size} selected
                    </span>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAll}
                        className="text-white border-white hover:bg-white hover:text-[#ff0080]"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deselectAll}
                        className="text-white border-white hover:bg-white hover:text-[#ff0080]"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkFavorite}
                      disabled={libraryState.selectedVideos.size === 0}
                      className="text-white border-white hover:bg-white hover:text-[#ff0080] flex items-center gap-1"
                    >
                      <HeartIcon className="w-4 h-4" />
                      Favorite
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadSelected}
                      disabled={libraryState.selectedVideos.size === 0}
                      className="text-white border-white hover:bg-white hover:text-[#ff0080] flex items-center gap-1"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Download
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={libraryState.selectedVideos.size === 0}
                      className="text-white border-white hover:bg-white hover:text-red-500 flex items-center gap-1"
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filters */}
          {(libraryState.filter.searchQuery || 
            libraryState.filter.status?.length || 
            libraryState.filter.tags?.length ||
            libraryState.filter.isFavorite !== undefined) && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 border-2 border-gray-200">
              <span className="text-sm font-bold">Active filters:</span>
              
              {libraryState.filter.searchQuery && (
                <span className="px-2 py-1 bg-[#ff0080] text-white text-xs font-bold">
                  Search: "{libraryState.filter.searchQuery}"
                </span>
              )}
              
              {libraryState.filter.status?.map(status => (
                <span key={status} className="px-2 py-1 bg-blue-500 text-white text-xs font-bold">
                  Status: {status}
                </span>
              ))}
              
              {libraryState.filter.isFavorite !== undefined && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold">
                  {libraryState.filter.isFavorite ? 'Favorites' : 'Not Favorited'}
                </span>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="ml-2 text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Grid/List */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loading size="lg" />
          <p className="mt-4 text-gray-600 font-bold">Loading your videos...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <Card variant="default" className="text-center py-12">
          <CardContent>
            <div className="text-gray-400 text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-bold mb-2">No videos found</h3>
            <p className="text-gray-600 mb-4">
              {videos.length === 0 
                ? "You haven't generated any videos yet. Create your first video to get started!"
                : "No videos match your current filters. Try adjusting your search or filter criteria."
              }
            </p>
            {videos.length === 0 ? (
              <Button variant="primary">Generate Your First Video</Button>
            ) : (
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={clsx(
          'video-grid',
          libraryState.viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        )}>
          <AnimatePresence>
            {filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={clsx(
                  'video-item relative',
                  libraryState.viewMode === 'list' && 'flex gap-4'
                )}
              >
                {/* Selection Checkbox */}
                {libraryState.isSelectionMode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 left-2 z-20"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(video.id);
                      }}
                      className={clsx(
                        'w-6 h-6 border-3 border-white flex items-center justify-center',
                        libraryState.selectedVideos.has(video.id)
                          ? 'bg-[#ff0080] text-white'
                          : 'bg-white text-transparent'
                      )}
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                <VideoPreview
                  video={video}
                  size={libraryState.viewMode === 'list' ? 'sm' : 'md'}
                  showMetadata
                  showActions
                  showStatus
                  onFavorite={toggleFavorite}
                  onDownload={(videoId) => {
                    const video = videos.find(v => v.id === videoId);
                    if (video?.videoUrl) {
                      const link = document.createElement('a');
                      link.href = video.videoUrl;
                      link.download = `${video.title}.mp4`;
                      link.click();
                    }
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {libraryState.pagination.totalCount > libraryState.pagination.pageSize && (
        <Card variant="default" className="mt-6">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(libraryState.pagination.page - 1) * libraryState.pagination.pageSize + 1} to{' '}
                {Math.min(
                  libraryState.pagination.page * libraryState.pagination.pageSize,
                  libraryState.pagination.totalCount
                )} of {libraryState.pagination.totalCount} videos
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousPage}
                  disabled={!libraryState.pagination.hasPreviousPage}
                >
                  Previous
                </Button>
                
                <span className="px-3 py-2 bg-gray-100 border-2 border-gray-300 text-sm font-bold">
                  Page {libraryState.pagination.page}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!libraryState.pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Modal */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Videos"
        size="md"
      >
        <div className="space-y-6">
          {/* Status Filter */}
          <div>
            <h3 className="font-bold mb-3">Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {['completed', 'processing', 'failed', 'pending'].map((status) => (
                <label key={status} className="flex items-center gap-2 p-2 border-2 border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={libraryState.filter.status?.includes(status as any) || false}
                    onChange={(e) => {
                      const currentStatus = libraryState.filter.status || [];
                      const newStatus = e.target.checked
                        ? [...currentStatus, status as any]
                        : currentStatus.filter(s => s !== status);
                      updateFilter({ status: newStatus.length > 0 ? newStatus : undefined });
                    }}
                    className="w-4 h-4"
                  />
                  <span className="capitalize font-semibold">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Favorite Filter */}
          <div>
            <h3 className="font-bold mb-3">Favorites</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2 border-2 border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="favorite"
                  checked={libraryState.filter.isFavorite === undefined}
                  onChange={() => updateFilter({ isFavorite: undefined })}
                />
                <span>All Videos</span>
              </label>
              <label className="flex items-center gap-2 p-2 border-2 border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="favorite"
                  checked={libraryState.filter.isFavorite === true}
                  onChange={() => updateFilter({ isFavorite: true })}
                />
                <span>Favorites Only</span>
              </label>
              <label className="flex items-center gap-2 p-2 border-2 border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="favorite"
                  checked={libraryState.filter.isFavorite === false}
                  onChange={() => updateFilter({ isFavorite: false })}
                />
                <span>Not Favorited</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={clearFilters}>
            Clear All
          </Button>
          <Button variant="primary" onClick={() => setShowFilters(false)}>
            Apply Filters
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default VideoHistory;