import html2canvas from 'html2canvas';
import { activityApi } from './activityApi';

const REPORT_INTERVAL_MS = 60_000;
const SCREENSHOT_MIN_MS = 10 * 60 * 1000;
const SCREENSHOT_MAX_MS = 15 * 60 * 1000;

class ActivityTrackerService {
  private mouseClicks = 0;
  private mouseMovements = 0;
  private keystrokes = 0;
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private screenshotTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionId: number | null = null;
  private intervalStart: Date | null = null;
  private boundHandlers: {
    click: () => void;
    mousemove: () => void;
    keydown: () => void;
  } | null = null;

  start(sessionId?: number | null) {
    if (this.intervalTimer != null) return;
    this.sessionId = sessionId ?? null;
    this.intervalStart = new Date();
    this.mouseClicks = 0;
    this.mouseMovements = 0;
    this.keystrokes = 0;

    const click = () => {
      this.mouseClicks += 1;
    };
    const mousemove = () => {
      this.mouseMovements += 1;
    };
    const keydown = () => {
      this.keystrokes += 1;
    };
    this.boundHandlers = { click, mousemove, keydown };
    document.addEventListener('click', click);
    document.addEventListener('mousemove', mousemove);
    document.addEventListener('keydown', keydown);

    this.intervalTimer = setInterval(() => this.reportActivity(), REPORT_INTERVAL_MS);
    this.scheduleNextScreenshot();
  }

  stop() {
    if (this.intervalTimer != null) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.screenshotTimer != null) {
      clearTimeout(this.screenshotTimer);
      this.screenshotTimer = null;
    }
    if (this.boundHandlers != null) {
      document.removeEventListener('click', this.boundHandlers.click);
      document.removeEventListener('mousemove', this.boundHandlers.mousemove);
      document.removeEventListener('keydown', this.boundHandlers.keydown);
      this.boundHandlers = null;
    }
    this.sessionId = null;
    this.intervalStart = null;
  }

  private reportActivity() {
    const end = new Date();
    const start = this.intervalStart ?? end;
    this.intervalStart = end;

    const payload = {
      mouseClicks: this.mouseClicks,
      mouseMovements: this.mouseMovements,
      keystrokes: this.keystrokes,
      intervalStart: start.toISOString(),
      intervalEnd: end.toISOString(),
      sessionId: this.sessionId,
    };
    this.mouseClicks = 0;
    this.mouseMovements = 0;
    this.keystrokes = 0;

    activityApi.logActivity(payload).catch((err) => {
      console.warn('[ActivityTracker] Failed to log activity:', err);
    });
  }

  private scheduleNextScreenshot() {
    const delay =
      SCREENSHOT_MIN_MS +
      Math.random() * (SCREENSHOT_MAX_MS - SCREENSHOT_MIN_MS);
    this.screenshotTimer = setTimeout(() => {
      this.screenshotTimer = null;
      this.captureScreenshot();
      this.scheduleNextScreenshot();
    }, delay);
  }

  private async captureScreenshot() {
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        logging: false,
      });
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.6);
      });
      if (!blob) return;

      const formData = new FormData();
      formData.append('screenshot', blob, 'screenshot.jpg');
      formData.append('pageUrl', window.location.pathname);
      if (this.sessionId != null) {
        formData.append('sessionId', String(this.sessionId));
      }
      await activityApi.uploadScreenshot(formData);
    } catch (err) {
      console.warn('[ActivityTracker] Screenshot capture failed:', err);
    }
  }

  /** Call when session is known (e.g. after getCurrentSession). */
  setSessionId(sessionId: number | null) {
    this.sessionId = sessionId;
  }
}

export const activityTracker = new ActivityTrackerService();
