import React, { useState, useEffect } from 'react';
import { Download, Image as ImageIcon, RefreshCw, Sparkles, ChevronDown, Copy, X, MessageSquare, LayoutGrid, Grid3X3, Maximize, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { useAuth } from "../../context/ClerkAuthContext";
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { logError, ErrorSeverity } from '../../utils/errorLogger';

type ImageForm = {
  prompt: string;
};

type GeneratedImage = {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  model: string;
  aspectRatio: string;
};

type ModelOption = {
  id: string;
  name: string;
  provider: string;
  description?: string;
};

type AspectRatioOption = {
  id: string;
  name: string;
  width: number;
  height: number;
  value: string;
};

const models: ModelOption[] = [
  { id: 'dall-e-3', name: 'DALL-E 3', provider: 'OpenAI' },
  { id: 'dall-e-2', name: 'DALL-E 2', provider: 'OpenAI' },
];

const aspectRatios: AspectRatioOption[] = [
  { id: 'square', name: '1:1 Square', width: 1024, height: 1024, value: '1024x1024' },
  { id: 'portrait', name: '2:3 Portrait', width: 1024, height: 1536, value: '1024x1536' },
  { id: 'landscape', name: '3:2 Landscape', width: 1536, height: 1024, value: '1536x1024' },
  { id: 'widescreen', name: '16:9 Widescreen', width: 1792, height: 1024, value: '1792x1024' },
];

const samplePrompts = [
  "A futuristic cityscape at sunset with flying cars and neon lights",
  "A magical forest with glowing mushrooms and fairy creatures",
  "An underwater scene with colorful coral reefs and exotic fish",
  "A cozy cafe interior with rain falling outside the window",
  "A surreal dreamscape with floating islands and impossible architecture",
  "A stylized portrait of a cyberpunk character with glowing implants",
  "A peaceful mountain landscape with a lake reflecting the sky",
  "A robot artist painting a masterpiece in a sun-filled studio",
  "A stunning aurora borealis over a snowy forest at night",
  "A bustling market in a sci-fi alien world with strange fruits and creatures"
];

const styles = [
  "Photorealistic", "Digital Art", "Oil Painting", "Watercolor",
  "3D Render", "Pixel Art", "Anime", "Comic Book", "Pencil Drawing",
  "Cyberpunk", "Steampunk", "Fantasy", "Sci-Fi", "Art Deco"
];

const ImagesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(aspectRatios[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showRatioDropdown, setShowRatioDropdown] = useState(false);
  const [showStylesDropdown, setShowStylesDropdown] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
  const [fullscreenImage, setFullscreenImage] = useState<GeneratedImage | null>(null);
  
  const { register, handleSubmit, setValue, watch, reset } = useForm<ImageForm>({
    defaultValues: {
      prompt: '',
    }
  });
  
  // Load saved images from localStorage on component mount
  useEffect(() => {
    const savedImages = localStorage.getItem('generatedImages');
    if (savedImages) {
      try {
        const parsedImages = JSON.parse(savedImages);
        setGeneratedImages(parsedImages.map((img: any) => ({
          ...img,
          timestamp: new Date(img.timestamp)
        })));
      } catch (error) {
        console.error('Failed to parse saved images:', error);
      }
    }
  }, []);
  
  // Save images to localStorage when they change
  useEffect(() => {
    if (generatedImages.length > 0) {
      localStorage.setItem('generatedImages', JSON.stringify(generatedImages));
    }
  }, [generatedImages]);
  
  const promptValue = watch('prompt');
  
  const onSubmit = async (data: ImageForm) => {
    if (!data.prompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Add style information if styles are selected
      let fullPrompt = data.prompt;
      if (selectedStyles.length > 0) {
        fullPrompt += `, style: ${selectedStyles.join(", ")}`;
      }
      
      // Generate image via OpenAI proxy
      const response = await fetch('/api/openai-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          params: {
            model: selectedModel.id,
            prompt: fullPrompt,
            n: 1,
            size: selectedAspectRatio.value,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
      }

      const result = await response.json();
      
      if (result && result.data && result.data.length > 0) {
        // Create image object for each response
        const newImages = result.data.map((item: any, index: number) => ({
          id: `image-${Date.now()}-${index}`,
          url: item.url,
          prompt: data.prompt,
          timestamp: new Date(),
          model: selectedModel.name,
          aspectRatio: selectedAspectRatio.name
        }));
        
        setGeneratedImages((prev) => [...newImages, ...prev]);
        
        // Show success message
        toast.success('Image generated successfully');
      } else {
        throw new Error('No image data returned from API');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      
      let errorMessage = 'Failed to generate image';
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('content_policy_violation')) {
          errorMessage = 'Your prompt may violate content policy. Please try a different prompt.';
        } else if (error.message.includes('rate_limit')) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.';
        } else if (error.message.includes('insufficient_quota')) {
          errorMessage = 'API quota exceeded. Please check your OpenAI API key.';
        }
        
        logError(error, {
          message: 'Image generation failed',
          context: {
            model: selectedModel.id,
            prompt: data.prompt.substring(0, 100) + (data.prompt.length > 100 ? '...' : ''),
            size: selectedAspectRatio.value
          },
          tags: ['openai', 'image-generation']
        }, ErrorSeverity.ERROR);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const usePrompt = (prompt: string) => {
    setValue('prompt', prompt);
  };
  
  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
      .then(() => toast.success('Prompt copied to clipboard'))
      .catch(() => toast.error('Failed to copy prompt'));
  };
  
  const deleteImage = (id: string) => {
    setGeneratedImages(prevImages => prevImages.filter(img => img.id !== id));
    toast.success('Image removed');
  };
  
  const downloadImage = async (url: string, filename: string) => {
    try {
      // Fetch the image
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a download link
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `${filename}.jpg`;
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Error downloading image:', error);
      logError(
        error instanceof Error ? error : new Error('Failed to download image'),
        {
          message: 'Error downloading generated image',
          context: { url, filename },
          tags: ['download', 'image']
        },
        ErrorSeverity.WARNING
      );
      toast.error('Failed to download image');
      
      // Fallback - open in new tab
      window.open(url, '_blank');
    }
  };
  
  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };
  
  const clearForm = () => {
    reset();
    setSelectedStyles([]);
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Image Generation</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-800' : ''}
            aria-label="Grid view"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setViewMode('detail')}
            className={viewMode === 'detail' ? 'bg-gray-100 dark:bg-gray-800' : ''}
            aria-label="Detail view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar - controls */}
        <div className="lg:col-span-1 space-y-6">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Generate Image</CardTitle>
              <CardDescription>
                Describe the image you want to create
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt
                  </label>
                  <div className="relative">
                    <textarea
                      id="prompt"
                      rows={5}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8"
                      placeholder="Describe the image you want to generate..."
                      {...register('prompt', { required: true })}
                    ></textarea>
                    {promptValue && (
                      <button
                        type="button"
                        onClick={clearForm}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Clear prompt"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Style
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100"
                      onClick={() => setShowStylesDropdown(!showStylesDropdown)}
                    >
                      <span className="truncate">
                        {selectedStyles.length === 0 
                          ? 'Select styles (optional)' 
                          : selectedStyles.join(', ')}
                      </span>
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    </button>
                    
                    <AnimatePresence>
                      {showStylesDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-10 mt-1 w-full rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-lg"
                        >
                          <div className="p-2 max-h-60 overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                              {styles.map((style) => (
                                <button
                                  key={style}
                                  type="button"
                                  onClick={() => toggleStyle(style)}
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    selectedStyles.includes(style)
                                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  {style}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="p-2 border-t border-gray-200 dark:border-gray-800 flex justify-between">
                            <button
                              type="button"
                              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                              onClick={() => setSelectedStyles([])}
                            >
                              Clear all
                            </button>
                            <button
                              type="button"
                              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                              onClick={() => setShowStylesDropdown(false)}
                            >
                              Done
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Model
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100"
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                    >
                      <div className="flex items-center">
                        <span className="mr-2">{selectedModel.name}</span>
                        <Badge variant="secondary" size="sm">
                          {selectedModel.provider}
                        </Badge>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    
                    <AnimatePresence>
                      {showModelDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-10 mt-1 w-full rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-lg"
                        >
                          <div className="p-1">
                            {models.map((model) => (
                              <div
                                key={model.id}
                                className={`flex items-center px-3 py-2 rounded-md cursor-pointer ${
                                  selectedModel.id === model.id
                                    ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                                onClick={() => {
                                  setSelectedModel(model);
                                  setShowModelDropdown(false);
                                }}
                              >
                                <span className="mr-2">{model.name}</span>
                                <Badge variant="secondary" size="sm">
                                  {model.provider}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Aspect Ratio
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100"
                      onClick={() => setShowRatioDropdown(!showRatioDropdown)}
                    >
                      <span>{selectedAspectRatio.name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    
                    <AnimatePresence>
                      {showRatioDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute z-10 mt-1 w-full rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-lg"
                        >
                          <div className="p-2 grid grid-cols-2 gap-2">
                            {aspectRatios.map((ratio) => (
                              <div
                                key={ratio.id}
                                className={`px-3 py-2 rounded-md cursor-pointer ${
                                  selectedAspectRatio.id === ratio.id
                                    ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                                onClick={() => {
                                  setSelectedAspectRatio(ratio);
                                  setShowRatioDropdown(false);
                                }}
                              >
                                <div className="text-center">
                                  <div className={`mx-auto mb-1 relative ${
                                    ratio.id === 'square' ? 'w-8 h-8' :
                                    ratio.id === 'portrait' ? 'w-6 h-8' :
                                    ratio.id === 'landscape' ? 'w-8 h-6' : 'w-8 h-5'
                                  } bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600`}></div>
                                  <span className="text-xs">{ratio.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isGenerating}
                  disabled={!promptValue.trim() || isGenerating}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Image
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Prompt Ideas</CardTitle>
              <CardDescription>Click on any prompt to use it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {samplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm group"
                  onClick={() => usePrompt(prompt)}
                >
                  <div className="flex justify-between items-center">
                    <span className="line-clamp-2">{prompt}</span>
                    <Copy className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => {
                      e.stopPropagation();
                      copyPrompt(prompt);
                    }} />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Right side - generated images */}
        <div className="lg:col-span-2">
          <Card variant="bordered" className="h-full">
            <CardHeader>
              <CardTitle>Generated Images</CardTitle>
              <CardDescription>
                {generatedImages.length > 0 
                  ? `${generatedImages.length} image${generatedImages.length !== 1 ? 's' : ''} generated`
                  : 'Your generated images will appear here'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedImages.length === 0 && !isGenerating ? (
                <EmptyState
                  icon={<ImageIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />}
                  title="No images generated yet"
                  description="Enter a prompt and click 'Generate Image' to create your first AI-generated image."
                  actions={{
                    primary: {
                      label: "Try a sample prompt",
                      onClick: () => usePrompt(samplePrompts[Math.floor(Math.random() * samplePrompts.length)])
                    }
                  }}
                />
              ) : (
                <div className="space-y-6">
                  {isGenerating && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-center">
                      <div className="flex flex-col items-center text-center">
                        <RefreshCw className="h-8 w-8 text-primary-600 animate-spin mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Generating your image...</h3>
                        <p className="text-gray-600 dark:text-gray-400">This may take a few moments</p>
                      </div>
                    </div>
                  )}
                  
                  <AnimatePresence>
                    {viewMode === 'grid' ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {generatedImages.map((image) => (
                          <motion.div
                            key={image.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden group relative"
                          >
                            <div className="aspect-square">
                              <img 
                                src={image.url} 
                                alt={image.prompt}
                                className="w-full h-full object-cover"
                                onClick={() => setFullscreenImage(image)}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="border-white/30 text-white hover:bg-white/10"
                                  onClick={() => downloadImage(image.url, `image-${image.id.slice(0, 8)}`)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="border-white/30 text-white hover:bg-white/10"
                                  onClick={() => deleteImage(image.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div className="p-3">
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{image.prompt}</p>
                              <div className="flex flex-wrap items-center justify-between mt-2 gap-2">
                                <Badge variant="secondary" size="sm">{image.model}</Badge>
                                <Badge variant="outline" size="sm">{image.aspectRatio}</Badge>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                {image.timestamp.toLocaleString()}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        {generatedImages.map((image) => (
                          <motion.div
                            key={image.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                          >
                            <div className="md:w-1/3 relative group">
                              <img 
                                src={image.url} 
                                alt={image.prompt}
                                className="w-full h-auto rounded-lg object-cover aspect-square"
                                onClick={() => setFullscreenImage(image)}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="border-white/30 text-white hover:bg-white/10"
                                  onClick={() => setFullscreenImage(image)}
                                >
                                  <Maximize className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                            <div className="md:w-2/3 flex flex-col">
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Image Details
                              </h3>
                              <div className="space-y-3 flex-1">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Prompt</p>
                                  <div className="flex">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">{image.prompt}</p>
                                    <button 
                                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                      onClick={() => copyPrompt(image.prompt)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Model</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{image.model}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aspect Ratio</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{image.aspectRatio}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Generated</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {image.timestamp.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-4">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => usePrompt(image.prompt)}
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Use Prompt
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => downloadImage(image.url, `image-${image.id.slice(0, 8)}`)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20"
                                  onClick={() => deleteImage(image.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen image viewer */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fullscreenImage) {
                    downloadImage(fullscreenImage.url, `image-${fullscreenImage.id.slice(0, 8)}`);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenImage(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="max-h-[90vh] max-w-[90vw] relative" onClick={(e) => e.stopPropagation()}>
              <img 
                src={fullscreenImage.url} 
                alt={fullscreenImage.prompt} 
                className="max-h-[90vh] max-w-[90vw] object-contain"
              />
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 rounded-lg p-3 text-white text-sm max-w-lg line-clamp-2 text-center">
              {fullscreenImage.prompt}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImagesPage;