import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

export const themeService = {
  /**
   * Get all theme-related settings for a company
   */
  async getThemeSettings(companyId: number) {
    const settings = await prisma.systemSetting.findMany({
      where: {
        companyId,
        key: {
          in: ['site_logo', 'site_name', 'contact_email', 'contact_phone', 'contact_address'],
        },
      },
    });

    // Convert array to object for easier access
    const settingsMap: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    return {
      siteLogo: settingsMap['site_logo'] || null,
      siteName: settingsMap['site_name'] || 'Omni CRM',
      contactEmail: settingsMap['contact_email'] || '',
      contactPhone: settingsMap['contact_phone'] || '',
      contactAddress: settingsMap['contact_address'] || '',
    };
  },

  /**
   * Update theme settings
   */
  async updateThemeSettings(
    companyId: number,
    data: {
      siteName?: string;
      contactEmail?: string;
      contactPhone?: string;
      contactAddress?: string;
    }
  ) {
    const updates: Promise<any>[] = [];

    if (data.siteName !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'site_name',
            },
          },
          update: { value: data.siteName },
          create: {
            companyId,
            key: 'site_name',
            value: data.siteName,
            description: 'Site name displayed in header and footer',
          },
        })
      );
    }

    if (data.contactEmail !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'contact_email',
            },
          },
          update: { value: data.contactEmail },
          create: {
            companyId,
            key: 'contact_email',
            value: data.contactEmail,
            description: 'Contact email address',
          },
        })
      );
    }

    if (data.contactPhone !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'contact_phone',
            },
          },
          update: { value: data.contactPhone },
          create: {
            companyId,
            key: 'contact_phone',
            value: data.contactPhone,
            description: 'Contact phone number',
          },
        })
      );
    }

    if (data.contactAddress !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'contact_address',
            },
          },
          update: { value: data.contactAddress },
          create: {
            companyId,
            key: 'contact_address',
            value: data.contactAddress,
            description: 'Contact address',
          },
        })
      );
    }

    await Promise.all(updates);

    return this.getThemeSettings(companyId);
  },

  /**
   * Handle logo upload and save path
   */
  async uploadLogo(companyId: number, filePath: string) {
    // Save logo path to system settings
    const setting = await prisma.systemSetting.upsert({
      where: {
        companyId_key: {
          companyId,
          key: 'site_logo',
        },
      },
      update: { value: filePath },
      create: {
        companyId,
        key: 'site_logo',
        value: filePath,
        description: 'Site logo file path',
      },
    });

    return setting;
  },

  /**
   * Get all hero-related settings for a company
   */
  async getHeroSettings(companyId: number) {
    const settings = await prisma.systemSetting.findMany({
      where: {
        companyId,
        key: {
          in: [
            'hero_title',
            'hero_subtitle',
            'hero_trust_indicator',
            'hero_background_type',
            'hero_background_image',
            'hero_background_video_youtube',
            'hero_background_video_local',
            'hero_cta_primary_text',
            'hero_cta_secondary_text',
            'hero_button_style',
            'hero_button_primary_color',
            'hero_button_primary_text_color',
            'hero_button_secondary_color',
            'hero_button_secondary_text_color',
            'hero_title_color',
            'hero_subtitle_color',
            'hero_trust_indicator_color',
            'hero_overlay_color',
            'hero_overlay_opacity',
            'hero_text_alignment',
            'hero_feature_highlight_1',
            'hero_feature_highlight_2',
            'hero_feature_highlight_3',
            'hero_feature_highlights_alignment',
            'hero_button_size',
            'hero_button_primary_icon',
            'hero_button_secondary_icon',
            'hero_addon_image',
            'hero_addon_image_alignment',
          ],
        },
      },
    });

    // Convert array to object for easier access
    const settingsMap: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    // Debug: Log the addon image alignment value
    if (settingsMap['hero_addon_image_alignment']) {
      console.log('Retrieved addon image alignment from DB:', settingsMap['hero_addon_image_alignment']);
    } else {
      console.log('Addon image alignment not found in settings, using default: center');
    }

    return {
      title: settingsMap['hero_title'] || 'Streamline Your Business Operations',
      subtitle: settingsMap['hero_subtitle'] || 'Complete CRM and project management solution for modern businesses. Manage leads, campaigns, projects, and clients all in one place.',
      trustIndicator: settingsMap['hero_trust_indicator'] || 'Trusted by 1000+ businesses worldwide',
      backgroundType: settingsMap['hero_background_type'] || 'gradient',
      backgroundImage: settingsMap['hero_background_image'] || null,
      backgroundVideoYoutube: settingsMap['hero_background_video_youtube'] || null,
      backgroundVideoLocal: settingsMap['hero_background_video_local'] || null,
      ctaPrimaryText: settingsMap['hero_cta_primary_text'] || 'Start Free Trial',
      ctaSecondaryText: settingsMap['hero_cta_secondary_text'] || 'Sign In',
      buttonStyle: settingsMap['hero_button_style'] || 'solid',
      buttonPrimaryColor: settingsMap['hero_button_primary_color'] || '#ffffff',
      buttonPrimaryTextColor: settingsMap['hero_button_primary_text_color'] || '#4f46e5',
      buttonSecondaryColor: settingsMap['hero_button_secondary_color'] || 'transparent',
      buttonSecondaryTextColor: settingsMap['hero_button_secondary_text_color'] || '#ffffff',
      titleColor: settingsMap['hero_title_color'] || '#ffffff',
      subtitleColor: settingsMap['hero_subtitle_color'] || '#e0e7ff',
      trustIndicatorColor: settingsMap['hero_trust_indicator_color'] || '#ffffff',
      overlayColor: settingsMap['hero_overlay_color'] || '#4f46e5',
      overlayOpacity: settingsMap['hero_overlay_opacity'] ? parseFloat(settingsMap['hero_overlay_opacity']) : 0.9,
      textAlignment: settingsMap['hero_text_alignment'] || 'center',
      featureHighlight1: settingsMap['hero_feature_highlight_1'] || 'No credit card required',
      featureHighlight2: settingsMap['hero_feature_highlight_2'] || '14-day free trial',
      featureHighlight3: settingsMap['hero_feature_highlight_3'] || 'Cancel anytime',
      featureHighlightsAlignment: settingsMap['hero_feature_highlights_alignment'] || 'center',
      buttonSize: settingsMap['hero_button_size'] || 'lg',
      buttonPrimaryIcon: settingsMap['hero_button_primary_icon'] || null,
      buttonSecondaryIcon: settingsMap['hero_button_secondary_icon'] || null,
      addonImage: settingsMap['hero_addon_image'] || null,
      addonImageAlignment: settingsMap['hero_addon_image_alignment'] && settingsMap['hero_addon_image_alignment'] !== '' 
        ? settingsMap['hero_addon_image_alignment'] 
        : 'center',
    };
  },

  /**
   * Update hero settings
   */
  async updateHeroSettings(
    companyId: number,
    data: {
      title?: string;
      subtitle?: string;
      trustIndicator?: string;
      backgroundType?: string;
      backgroundVideoYoutube?: string;
      ctaPrimaryText?: string;
      ctaSecondaryText?: string;
      buttonStyle?: string;
      buttonPrimaryColor?: string;
      buttonPrimaryTextColor?: string;
      buttonSecondaryColor?: string;
      buttonSecondaryTextColor?: string;
      titleColor?: string;
      subtitleColor?: string;
      trustIndicatorColor?: string;
      overlayColor?: string;
      overlayOpacity?: number;
      textAlignment?: string;
      featureHighlight1?: string;
      featureHighlight2?: string;
      featureHighlight3?: string;
      featureHighlightsAlignment?: string;
      buttonSize?: string;
      buttonPrimaryIcon?: string;
      buttonSecondaryIcon?: string;
      addonImage?: string;
      addonImageAlignment?: string;
    }
  ) {
    const updates: Promise<any>[] = [];

    if (data.title !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_title',
            },
          },
          update: { value: data.title },
          create: {
            companyId,
            key: 'hero_title',
            value: data.title,
            description: 'Hero section main headline',
          },
        })
      );
    }

    if (data.subtitle !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_subtitle',
            },
          },
          update: { value: data.subtitle },
          create: {
            companyId,
            key: 'hero_subtitle',
            value: data.subtitle,
            description: 'Hero section subheadline',
          },
        })
      );
    }

    if (data.trustIndicator !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_trust_indicator',
            },
          },
          update: { value: data.trustIndicator },
          create: {
            companyId,
            key: 'hero_trust_indicator',
            value: data.trustIndicator,
            description: 'Hero section trust indicator text',
          },
        })
      );
    }

    if (data.backgroundType !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_background_type',
            },
          },
          update: { value: data.backgroundType },
          create: {
            companyId,
            key: 'hero_background_type',
            value: data.backgroundType,
            description: 'Hero background type: image, video_youtube, video_local, or gradient',
          },
        })
      );
    }

    if (data.backgroundVideoYoutube !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_background_video_youtube',
            },
          },
          update: { value: data.backgroundVideoYoutube },
          create: {
            companyId,
            key: 'hero_background_video_youtube',
            value: data.backgroundVideoYoutube,
            description: 'YouTube video URL or ID for hero background',
          },
        })
      );
    }

    if (data.ctaPrimaryText !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_cta_primary_text',
            },
          },
          update: { value: data.ctaPrimaryText },
          create: {
            companyId,
            key: 'hero_cta_primary_text',
            value: data.ctaPrimaryText,
            description: 'Primary CTA button text',
          },
        })
      );
    }

    if (data.ctaSecondaryText !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_cta_secondary_text',
            },
          },
          update: { value: data.ctaSecondaryText },
          create: {
            companyId,
            key: 'hero_cta_secondary_text',
            value: data.ctaSecondaryText,
            description: 'Secondary CTA button text',
          },
        })
      );
    }

    if (data.buttonStyle !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_button_style',
            },
          },
          update: { value: data.buttonStyle },
          create: {
            companyId,
            key: 'hero_button_style',
            value: data.buttonStyle,
            description: 'Hero button style: solid, outline, gradient, pill, or soft-shadow',
          },
        })
      );
    }

    if (data.buttonPrimaryColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_button_primary_color',
            },
          },
          update: { value: data.buttonPrimaryColor },
          create: {
            companyId,
            key: 'hero_button_primary_color',
            value: data.buttonPrimaryColor,
            description: 'Primary button background color (hex)',
          },
        })
      );
    }

    if (data.buttonPrimaryTextColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_button_primary_text_color',
            },
          },
          update: { value: data.buttonPrimaryTextColor },
          create: {
            companyId,
            key: 'hero_button_primary_text_color',
            value: data.buttonPrimaryTextColor,
            description: 'Primary button text color (hex)',
          },
        })
      );
    }

    if (data.buttonSecondaryColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_button_secondary_color',
            },
          },
          update: { value: data.buttonSecondaryColor },
          create: {
            companyId,
            key: 'hero_button_secondary_color',
            value: data.buttonSecondaryColor,
            description: 'Secondary button background color (hex)',
          },
        })
      );
    }

    if (data.buttonSecondaryTextColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_button_secondary_text_color',
            },
          },
          update: { value: data.buttonSecondaryTextColor },
          create: {
            companyId,
            key: 'hero_button_secondary_text_color',
            value: data.buttonSecondaryTextColor,
            description: 'Secondary button text color (hex)',
          },
        })
      );
    }

    if (data.titleColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_title_color',
            },
          },
          update: { value: data.titleColor },
          create: {
            companyId,
            key: 'hero_title_color',
            value: data.titleColor,
            description: 'Hero title text color (hex)',
          },
        })
      );
    }

    if (data.subtitleColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_subtitle_color',
            },
          },
          update: { value: data.subtitleColor },
          create: {
            companyId,
            key: 'hero_subtitle_color',
            value: data.subtitleColor,
            description: 'Hero subtitle text color (hex)',
          },
        })
      );
    }

    if (data.trustIndicatorColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_trust_indicator_color',
            },
          },
          update: { value: data.trustIndicatorColor },
          create: {
            companyId,
            key: 'hero_trust_indicator_color',
            value: data.trustIndicatorColor,
            description: 'Hero trust indicator text color (hex)',
          },
        })
      );
    }

    if (data.overlayColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_overlay_color',
            },
          },
          update: { value: data.overlayColor },
          create: {
            companyId,
            key: 'hero_overlay_color',
            value: data.overlayColor,
            description: 'Hero overlay background color (hex)',
          },
        })
      );
    }

    if (data.overlayOpacity !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_overlay_opacity',
            },
          },
          update: { value: data.overlayOpacity.toString() },
          create: {
            companyId,
            key: 'hero_overlay_opacity',
            value: data.overlayOpacity.toString(),
            description: 'Hero overlay opacity (0-1)',
          },
        })
      );
    }

    if (data.textAlignment !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_text_alignment',
            },
          },
          update: { value: data.textAlignment },
          create: {
            companyId,
            key: 'hero_text_alignment',
            value: data.textAlignment,
            description: 'Hero text alignment: left, center, or right',
          },
        })
      );
    }

    if (data.featureHighlight1 !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_feature_highlight_1',
            },
          },
          update: { value: data.featureHighlight1 },
          create: {
            companyId,
            key: 'hero_feature_highlight_1',
            value: data.featureHighlight1,
            description: 'Hero feature highlight 1 text',
          },
        })
      );
    }

    if (data.featureHighlight2 !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_feature_highlight_2',
            },
          },
          update: { value: data.featureHighlight2 },
          create: {
            companyId,
            key: 'hero_feature_highlight_2',
            value: data.featureHighlight2,
            description: 'Hero feature highlight 2 text',
          },
        })
      );
    }

    if (data.featureHighlight3 !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_feature_highlight_3',
            },
          },
          update: { value: data.featureHighlight3 },
          create: {
            companyId,
            key: 'hero_feature_highlight_3',
            value: data.featureHighlight3,
            description: 'Hero feature highlight 3 text',
          },
        })
      );
    }

    if (data.featureHighlightsAlignment !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_feature_highlights_alignment',
            },
          },
          update: { value: data.featureHighlightsAlignment },
          create: {
            companyId,
            key: 'hero_feature_highlights_alignment',
            value: data.featureHighlightsAlignment,
            description: 'Hero feature highlights alignment: left, center, or right',
          },
        })
      );
    }

    if (data.buttonSize !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_button_size',
            },
          },
          update: { value: data.buttonSize },
          create: {
            companyId,
            key: 'hero_button_size',
            value: data.buttonSize,
            description: 'Hero button size: sm, md, lg, or xl',
          },
        })
      );
    }

    if (data.buttonPrimaryIcon !== undefined) {
      // Allow empty string to clear the icon - use empty string instead of null since value field is required
      const iconValue = data.buttonPrimaryIcon && data.buttonPrimaryIcon.trim() !== '' ? data.buttonPrimaryIcon.trim() : '';
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_button_primary_icon',
            },
          },
          update: { value: iconValue },
          create: {
            companyId,
            key: 'hero_button_primary_icon',
            value: iconValue,
            description: 'Primary button icon name',
          },
        })
      );
    }

    if (data.buttonSecondaryIcon !== undefined) {
      // Allow empty string to clear the icon - use empty string instead of null since value field is required
      const iconValue = data.buttonSecondaryIcon && data.buttonSecondaryIcon.trim() !== '' ? data.buttonSecondaryIcon.trim() : '';
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'hero_button_secondary_icon',
            },
          },
          update: { value: iconValue },
          create: {
            companyId,
            key: 'hero_button_secondary_icon',
            value: iconValue,
            description: 'Secondary button icon name',
          },
        })
      );
    }

    if (data.addonImageAlignment !== undefined && data.addonImageAlignment !== null && data.addonImageAlignment !== '') {
      const alignmentValue = String(data.addonImageAlignment);
      // Validate it's one of the allowed values
      if (['left', 'center', 'right'].includes(alignmentValue)) {
        updates.push(
          prisma.systemSetting.upsert({
            where: {
              companyId_key: {
                companyId,
                key: 'hero_addon_image_alignment',
              },
            },
            update: { value: alignmentValue },
            create: {
              companyId,
              key: 'hero_addon_image_alignment',
              value: alignmentValue,
              description: 'Hero addon image alignment: left, center, or right',
            },
          })
        );
      }
    }

    try {
      await Promise.all(updates);
    } catch (error: any) {
      console.error('Error updating hero settings:', error);
      throw new Error(`Failed to update hero settings: ${error.message || 'Unknown error'}`);
    }

    return this.getHeroSettings(companyId);
  },

  /**
   * Handle hero image upload and save path
   */
  async uploadHeroImage(companyId: number, filePath: string) {
    // Save image path to system settings
    const setting = await prisma.systemSetting.upsert({
      where: {
        companyId_key: {
          companyId,
          key: 'hero_background_image',
        },
      },
      update: { value: filePath },
      create: {
        companyId,
        key: 'hero_background_image',
        value: filePath,
        description: 'Hero background image file path',
      },
    });

    // Also update background type to 'image' if not already set
    await prisma.systemSetting.upsert({
      where: {
        companyId_key: {
          companyId,
          key: 'hero_background_type',
        },
      },
      update: { value: 'image' },
      create: {
        companyId,
        key: 'hero_background_type',
        value: 'image',
        description: 'Hero background type',
      },
    });

    return setting;
  },

  /**
   * Handle hero video upload and save path
   */
  async uploadHeroVideo(companyId: number, filePath: string) {
    // Save video path to system settings
    const setting = await prisma.systemSetting.upsert({
      where: {
        companyId_key: {
          companyId,
          key: 'hero_background_video_local',
        },
      },
      update: { value: filePath },
      create: {
        companyId,
        key: 'hero_background_video_local',
        value: filePath,
        description: 'Hero background local video file path',
      },
    });

    // Also update background type to 'video_local' if not already set
    await prisma.systemSetting.upsert({
      where: {
        companyId_key: {
          companyId,
          key: 'hero_background_type',
        },
      },
      update: { value: 'video_local' },
      create: {
        companyId,
        key: 'hero_background_type',
        value: 'video_local',
        description: 'Hero background type',
      },
    });

    return setting;
  },

  /**
   * Handle hero addon image upload and save path
   */
  async uploadHeroAddonImage(companyId: number, filePath: string) {
    // Save addon image path to system settings
    const setting = await prisma.systemSetting.upsert({
      where: {
        companyId_key: {
          companyId,
          key: 'hero_addon_image',
        },
      },
      update: { value: filePath },
      create: {
        companyId,
        key: 'hero_addon_image',
        value: filePath,
        description: 'Hero addon image file path (supports GIF)',
      },
    });

    return setting;
  },
};

