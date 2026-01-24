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

    // Handle addon image clearing (empty string means delete)
    if (data.addonImage !== undefined) {
      if (data.addonImage === '' || data.addonImage === null) {
        // Delete the addon image setting
        updates.push(
          prisma.systemSetting.deleteMany({
            where: {
              companyId,
              key: 'hero_addon_image',
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

  /**
   * Get header settings
   */
  async getHeaderSettings(companyId: number) {
    const settings = await prisma.systemSetting.findMany({
      where: {
        companyId,
        key: {
          in: [
            'header_menu_about',
            'header_menu_services',
            'header_menu_contact',
            'header_menu_terms',
            'header_menu_privacy',
            'header_menu_sitemap',
            'header_button_primary_text',
            'header_button_secondary_text',
            'header_background_color',
            'header_text_color',
            'header_button_bg_color',
            'header_button_text_color',
            'header_button_secondary_bg_color',
            'header_button_secondary_text_color',
            'header_is_fixed',
            'header_is_transparent',
            'header_logo',
            'header_logo_type',
          ],
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    return {
      menuAbout: settingsMap['header_menu_about'] || 'About',
      menuServices: settingsMap['header_menu_services'] || 'Services',
      menuContact: settingsMap['header_menu_contact'] || 'Contact',
      menuTerms: settingsMap['header_menu_terms'] || 'Terms',
      menuPrivacy: settingsMap['header_menu_privacy'] || 'Privacy',
      menuSitemap: settingsMap['header_menu_sitemap'] || 'Sitemap',
      buttonPrimaryText: settingsMap['header_button_primary_text'] || 'Get Started',
      buttonSecondaryText: settingsMap['header_button_secondary_text'] || 'Sign In',
      backgroundColor: settingsMap['header_background_color'] || '#ffffff',
      textColor: settingsMap['header_text_color'] || '#1e293b',
      buttonBgColor: settingsMap['header_button_bg_color'] || '#4f46e5',
      buttonTextColor: settingsMap['header_button_text_color'] || '#ffffff',
      buttonSecondaryBgColor: settingsMap['header_button_secondary_bg_color'] || 'transparent',
      buttonSecondaryTextColor: settingsMap['header_button_secondary_text_color'] || '#1e293b',
      isFixed: settingsMap['header_is_fixed'] === 'true',
      isTransparent: settingsMap['header_is_transparent'] === 'true',
      logo: settingsMap['header_logo'] || null,
      logoType: settingsMap['header_logo_type'] || 'with-text', // 'wide' or 'with-text'
    };
  },

  /**
   * Update header settings
   */
  async updateHeaderSettings(
    companyId: number,
    data: {
      menuAbout?: string;
      menuServices?: string;
      menuContact?: string;
      menuTerms?: string;
      menuPrivacy?: string;
      menuSitemap?: string;
      buttonPrimaryText?: string;
      buttonSecondaryText?: string;
      backgroundColor?: string;
      textColor?: string;
      buttonBgColor?: string;
      buttonTextColor?: string;
      buttonSecondaryBgColor?: string;
      buttonSecondaryTextColor?: string;
      isFixed?: boolean;
      isTransparent?: boolean;
    }
  ) {
    const updates: Promise<any>[] = [];

    if (data.menuAbout !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_menu_about',
            },
          },
          update: { value: data.menuAbout },
          create: {
            companyId,
            key: 'header_menu_about',
            value: data.menuAbout,
            description: 'Header menu item: About',
          },
        })
      );
    }

    if (data.menuServices !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_menu_services',
            },
          },
          update: { value: data.menuServices },
          create: {
            companyId,
            key: 'header_menu_services',
            value: data.menuServices,
            description: 'Header menu item: Services',
          },
        })
      );
    }

    if (data.menuContact !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_menu_contact',
            },
          },
          update: { value: data.menuContact },
          create: {
            companyId,
            key: 'header_menu_contact',
            value: data.menuContact,
            description: 'Header menu item: Contact',
          },
        })
      );
    }

    if (data.menuTerms !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_menu_terms',
            },
          },
          update: { value: data.menuTerms },
          create: {
            companyId,
            key: 'header_menu_terms',
            value: data.menuTerms,
            description: 'Header menu item: Terms',
          },
        })
      );
    }

    if (data.menuPrivacy !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_menu_privacy',
            },
          },
          update: { value: data.menuPrivacy },
          create: {
            companyId,
            key: 'header_menu_privacy',
            value: data.menuPrivacy,
            description: 'Header menu item: Privacy',
          },
        })
      );
    }

    if (data.menuSitemap !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_menu_sitemap',
            },
          },
          update: { value: data.menuSitemap },
          create: {
            companyId,
            key: 'header_menu_sitemap',
            value: data.menuSitemap,
            description: 'Header menu item: Sitemap',
          },
        })
      );
    }

    if (data.buttonPrimaryText !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_button_primary_text',
            },
          },
          update: { value: data.buttonPrimaryText },
          create: {
            companyId,
            key: 'header_button_primary_text',
            value: data.buttonPrimaryText,
            description: 'Header primary button text',
          },
        })
      );
    }

    if (data.buttonSecondaryText !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_button_secondary_text',
            },
          },
          update: { value: data.buttonSecondaryText },
          create: {
            companyId,
            key: 'header_button_secondary_text',
            value: data.buttonSecondaryText,
            description: 'Header secondary button text',
          },
        })
      );
    }

    if (data.backgroundColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_background_color',
            },
          },
          update: { value: data.backgroundColor },
          create: {
            companyId,
            key: 'header_background_color',
            value: data.backgroundColor,
            description: 'Header background color',
          },
        })
      );
    }

    if (data.textColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_text_color',
            },
          },
          update: { value: data.textColor },
          create: {
            companyId,
            key: 'header_text_color',
            value: data.textColor,
            description: 'Header text color',
          },
        })
      );
    }

    if (data.buttonBgColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_button_bg_color',
            },
          },
          update: { value: data.buttonBgColor },
          create: {
            companyId,
            key: 'header_button_bg_color',
            value: data.buttonBgColor,
            description: 'Header primary button background color',
          },
        })
      );
    }

    if (data.buttonTextColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_button_text_color',
            },
          },
          update: { value: data.buttonTextColor },
          create: {
            companyId,
            key: 'header_button_text_color',
            value: data.buttonTextColor,
            description: 'Header primary button text color',
          },
        })
      );
    }

    if (data.buttonSecondaryBgColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_button_secondary_bg_color',
            },
          },
          update: { value: data.buttonSecondaryBgColor },
          create: {
            companyId,
            key: 'header_button_secondary_bg_color',
            value: data.buttonSecondaryBgColor,
            description: 'Header secondary button background color',
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
              key: 'header_button_secondary_text_color',
            },
          },
          update: { value: data.buttonSecondaryTextColor },
          create: {
            companyId,
            key: 'header_button_secondary_text_color',
            value: data.buttonSecondaryTextColor,
            description: 'Header secondary button text color',
          },
        })
      );
    }

    if (data.isFixed !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_is_fixed',
            },
          },
          update: { value: data.isFixed ? 'true' : 'false' },
          create: {
            companyId,
            key: 'header_is_fixed',
            value: data.isFixed ? 'true' : 'false',
            description: 'Header fixed positioning (true/false)',
          },
        })
      );
    }

    if (data.isTransparent !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'header_is_transparent',
            },
          },
          update: { value: data.isTransparent ? 'true' : 'false' },
          create: {
            companyId,
            key: 'header_is_transparent',
            value: data.isTransparent ? 'true' : 'false',
            description: 'Header transparent background (true/false)',
          },
        })
      );
    }

    // Handle logo clearing (empty string means delete)
    if (data.logo !== undefined) {
      if (data.logo === '' || data.logo === null) {
        // Delete the logo setting
        updates.push(
          prisma.systemSetting.deleteMany({
            where: {
              companyId,
              key: 'header_logo',
            },
          })
        );
      } else {
        updates.push(
          prisma.systemSetting.upsert({
            where: {
              companyId_key: {
                companyId,
                key: 'header_logo',
              },
            },
            update: { value: data.logo },
            create: {
              companyId,
              key: 'header_logo',
              value: data.logo,
              description: 'Header logo file path (supports SVG, PNG, JPG, WebP)',
            },
          })
        );
      }
    }

    if (data.logoType !== undefined) {
      const logoTypeValue = String(data.logoType);
      if (['wide', 'with-text'].includes(logoTypeValue)) {
        updates.push(
          prisma.systemSetting.upsert({
            where: {
              companyId_key: {
                companyId,
                key: 'header_logo_type',
              },
            },
            update: { value: logoTypeValue },
            create: {
              companyId,
              key: 'header_logo_type',
              value: logoTypeValue,
              description: 'Header logo type: wide (without text) or with-text',
            },
          })
        );
      }
    }

    try {
      await Promise.all(updates);
    } catch (error: any) {
      console.error('Error updating header settings:', error);
      throw new Error(`Failed to update header settings: ${error.message || 'Unknown error'}`);
    }

    return this.getHeaderSettings(companyId);
  },

  /**
   * Handle header logo upload and save path
   */
  async uploadHeaderLogo(companyId: number, filePath: string) {
    // Save header logo path to system settings
    const setting = await prisma.systemSetting.upsert({
      where: {
        companyId_key: {
          companyId,
          key: 'header_logo',
        },
      },
      update: { value: filePath },
      create: {
        companyId,
        key: 'header_logo',
        value: filePath,
        description: 'Header logo file path (supports SVG, PNG, JPG, WebP)',
      },
    });

    return setting;
  },

  /**
   * Get color settings
   */
  async getColorSettings(companyId: number) {
    const settings = await prisma.systemSetting.findMany({
      where: {
        companyId,
        key: {
          in: [
            'theme_primary_color',
            'theme_secondary_color',
          ],
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    return {
      primaryColor: settingsMap['theme_primary_color'] || '#4f46e5',
      secondaryColor: settingsMap['theme_secondary_color'] || '#7c3aed',
    };
  },

  /**
   * Update color settings
   */
  async updateColorSettings(
    companyId: number,
    data: {
      primaryColor?: string;
      secondaryColor?: string;
    }
  ) {
    const updates: Promise<any>[] = [];

    if (data.primaryColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'theme_primary_color',
            },
          },
          update: { value: data.primaryColor },
          create: {
            companyId,
            key: 'theme_primary_color',
            value: data.primaryColor,
            description: 'Theme primary color (hex format)',
          },
        })
      );
    }

    if (data.secondaryColor !== undefined) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            companyId_key: {
              companyId,
              key: 'theme_secondary_color',
            },
          },
          update: { value: data.secondaryColor },
          create: {
            companyId,
            key: 'theme_secondary_color',
            value: data.secondaryColor,
            description: 'Theme secondary color (hex format)',
          },
        })
      );
    }

    try {
      await Promise.all(updates);
    } catch (error: any) {
      console.error('Error updating color settings:', error);
      throw new Error(`Failed to update color settings: ${error.message || 'Unknown error'}`);
    }

    return this.getColorSettings(companyId);
  },
};

