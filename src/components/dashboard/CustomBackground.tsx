import { memo } from 'react';
import { useWallpaperSettings } from './WallpaperSelector';
import defaultWallpaper from '@/assets/default-wallpaper.jpg';
import meshCurveWallpaper from '@/assets/wp-mesh-curve.jpg';
import dashboardCoderBackground from '@/assets/dashboard-coder-bg.jpg';

const PRESET_GRADIENTS: Record<string, string> = {
  'carbon': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
  'night-sky': 'linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'deep-ocean': 'linear-gradient(135deg, #0a192f 0%, #112240 50%, #0a192f 100%)',
  'geometric': 'repeating-linear-gradient(45deg, #1a1a2e 0px, #1a1a2e 10px, #16213e 10px, #16213e 20px)',
};

export const CustomBackground = memo(() => {
  const settings = useWallpaperSettings();

  const getBackgroundStyle = (): React.CSSProperties => {
    if (settings.type === 'preset' && settings.presetId) {
      // Image preset
      if (settings.presetType === 'image' && settings.presetUrl) {
        const resolvedUrl = settings.presetId === 'stripes-3d' ? meshCurveWallpaper : settings.presetUrl;
        return {
          backgroundImage: `url(${resolvedUrl})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#000',
          opacity: settings.opacity,
        };
      }
      // Gradient preset
      if (PRESET_GRADIENTS[settings.presetId]) {
        return {
          background: PRESET_GRADIENTS[settings.presetId],
          opacity: settings.opacity,
        };
      }
    }

    if (settings.type === 'custom' && settings.customUrl) {
      return {
        backgroundImage: `url(${settings.customUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 1,
      };
    }

    // Default wallpaper
    return {
      backgroundImage: `url(${dashboardCoderBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      opacity: settings.opacity ?? 0.35,
    };
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none transition-opacity duration-500"
      style={{ ...getBackgroundStyle(), zIndex: -40 }}
    />
  );
});

CustomBackground.displayName = 'CustomBackground';
