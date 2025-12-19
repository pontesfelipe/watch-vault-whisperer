import { supabase } from "@/integrations/supabase/client";

interface DeviceInfo {
  deviceType: string;
  browser: string;
  os: string;
}

export const parseUserAgent = (userAgent: string): DeviceInfo => {
  let deviceType = 'desktop';
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect device type
  if (/mobile/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = 'tablet';
  }

  // Detect browser
  if (/chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/edge|edg/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/opera|opr/i.test(userAgent)) {
    browser = 'Opera';
  }

  // Detect OS
  if (/windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/macintosh|mac os/i.test(userAgent)) {
    os = 'macOS';
  } else if (/linux/i.test(userAgent) && !/android/i.test(userAgent)) {
    os = 'Linux';
  } else if (/android/i.test(userAgent)) {
    os = 'Android';
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    os = 'iOS';
  }

  return { deviceType, browser, os };
};

export const recordLoginAttempt = async (
  userId: string,
  success: boolean,
  failureReason?: string
) => {
  try {
    const userAgent = navigator.userAgent;
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    // Get IP and location from a free API (optional, may fail)
    let ipAddress: string | null = null;
    let city: string | null = null;
    let country: string | null = null;

    try {
      const response = await fetch('https://ipapi.co/json/', { 
        signal: AbortSignal.timeout(3000) 
      });
      if (response.ok) {
        const data = await response.json();
        ipAddress = data.ip || null;
        city = data.city || null;
        country = data.country_name || null;
      }
    } catch {
      // Silently fail - IP/location is optional
    }

    const { error } = await supabase.from('login_history').insert({
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_type: deviceType,
      browser,
      os,
      city,
      country,
      success,
      failure_reason: failureReason || null,
    });

    if (error) {
      console.error('Failed to record login attempt:', error);
    }
  } catch (error) {
    console.error('Error recording login attempt:', error);
  }
};
