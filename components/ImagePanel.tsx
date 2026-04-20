'use client';

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

export interface ImagePanelHandle {
  setTransform: (x: number, y: number, scale: number) => void;
  getTransform: () => { x: number; y: number; scale: number };
  resetTransform: () => void;
}

interface Props {
  imageUrl: string;
  label: string;
  index: 'left' | 'right';
  syncEnabled?: boolean;
  onTransformChange?: (x: number, y: number, scale: number) => void;
}

const ImagePanel = forwardRef<ImagePanelHandle, Props>(function ImagePanel(
  { imageUrl, label, index, syncEnabled, onTransformChange },
  ref,
) {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const suppressSync = useRef(false);

  useImperativeHandle(ref, () => ({
    setTransform(x, y, scale) {
      if (suppressSync.current) return;
      suppressSync.current = true;
      transformRef.current?.setTransform(x, y, scale, 0);
      setTimeout(() => { suppressSync.current = false; }, 20);
    },
    getTransform() {
      const s = transformRef.current?.instance.transformState;
      return { x: s?.positionX ?? 0, y: s?.positionY ?? 0, scale: s?.scale ?? 1 };
    },
    resetTransform() {
      transformRef.current?.resetTransform();
    },
  }));

  const handleTransformed = useCallback(
    (_ref: ReactZoomPanPinchRef, state: { positionX: number; positionY: number; scale: number }) => {
      if (syncEnabled && onTransformChange && !suppressSync.current) {
        onTransformChange(state.positionX, state.positionY, state.scale);
      }
    },
    [syncEnabled, onTransformChange],
  );

  const panelColor = index === 'left' ? 'border-indigo-600/40' : 'border-violet-600/40';
  const badgeColor = index === 'left' ? 'bg-indigo-600' : 'bg-violet-600';

  const content = (
    <div className={`relative flex flex-col bg-surface-card border ${panelColor} rounded-xl overflow-hidden h-full`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border bg-surface-raised shrink-0">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${badgeColor}`}>
          {label}
        </span>
        <div className="flex items-center gap-1">
          <button
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => transformRef.current?.zoomIn(0.5)}
            className="p-1 rounded text-gray-400 hover:text-gray-100 hover:bg-surface-border transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          <button
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => transformRef.current?.zoomOut(0.5)}
            className="p-1 rounded text-gray-400 hover:text-gray-100 hover:bg-surface-border transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <button
            aria-label="Reset zoom"
            title="Reset zoom (double-click image)"
            onClick={() => transformRef.current?.resetTransform()}
            className="p-1 rounded text-gray-400 hover:text-gray-100 hover:bg-surface-border transition-colors text-xs font-mono"
          >
            1:1
          </button>
          <button
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
            title={isFullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
            onClick={() => setIsFullscreen((v) => !v)}
            className="p-1 rounded text-gray-400 hover:text-gray-100 hover:bg-surface-border transition-colors"
          >
            {isFullscreen ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 overflow-hidden bg-[#0a0a0f] min-h-0">
        {isFullscreen ? (
          <div
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
              <button
                className="absolute top-4 right-4 z-10 p-2 bg-black/60 rounded-full text-white hover:bg-black"
                onClick={() => setIsFullscreen(false)}
                aria-label="Close fullscreen"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <TransformWrapper minScale={0.1} maxScale={20} centerOnInit>
                <TransformComponent wrapperStyle={{ width: '100%', height: '100vh' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={label}
                    className="max-w-full max-h-screen object-contain"
                    onError={() => setImgError(true)}
                  />
                </TransformComponent>
              </TransformWrapper>
            </div>
          </div>
        ) : null}

        <TransformWrapper
          ref={transformRef}
          minScale={0.1}
          maxScale={20}
          centerOnInit
          onTransformed={handleTransformed}
          doubleClick={{ mode: 'reset' }}
        >
          <TransformComponent
            wrapperStyle={{ width: '100%', height: '100%' }}
            contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {imgError ? (
              <div className="flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Image failed to load</p>
                <p className="text-xs mt-1 break-all opacity-60">{imageUrl}</p>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={label}
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
                onError={() => setImgError(true)}
              />
            )}
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );

  return content;
});

export default ImagePanel;
