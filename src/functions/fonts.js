
import { mapFontsToSource } from "../config/fonts.js";

export async function addFontFace(nameOrUrl, customName = null) {
  // Check if it's a URL (direct font URL from database)
  const isUrl = nameOrUrl.startsWith('http://') || nameOrUrl.startsWith('https://');
  
  let fontName, fontSource;
  
  if (isUrl) {
    // Use the URL directly
    fontSource = nameOrUrl;
    // Extract font name from URL or use customName
    if (customName) {
      fontName = customName;
    } else {
      // Extract filename from URL as fallback
      const urlParts = nameOrUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      fontName = filename.split('.')[0].replace(/[-_]/g, ' ');
    }
  } else {
    // Look up in local font map
    fontName = nameOrUrl;
    fontSource = mapFontsToSource[nameOrUrl];
    
    if (!fontSource) {
      return {
        error: "Cannot locate font. Default font will be used to preview",
        name: "Montserrat",
      };
    }
  }

  try {
    // Check if font is already loaded
    if (document.fonts.check(`12px "${fontName}"`)) {
      return {
        error: null,
        name: fontName,
      };
    }
  } catch (e) {
    // Continue to load if check fails
  }

  try {
    const fontFace = new FontFace(fontName, `url(${fontSource})`);
    document.fonts.add(fontFace);
    await fontFace.load();
    return {
      error: null,
      name: fontName,
    };
  } catch (e) {
    console.error('Font loading error:', e);
    return {
      error: "Unable to load font. Default font will be used to preview",
      name: "Montserrat",
    };
  }
}
