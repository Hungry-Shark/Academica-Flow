// Secure session management utility
import { getFirebaseAuth } from '../firebase';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout

class SessionManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isActive: boolean = true;

  constructor() {
    this.setupActivityListeners();
    this.startSessionRefresh();
  }

  private setupActivityListeners() {
    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      this.lastActivity = Date.now();
      this.isActive = true;
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check for inactivity
    setInterval(() => {
      if (Date.now() - this.lastActivity > SESSION_TIMEOUT) {
        this.handleSessionTimeout();
      } else if (Date.now() - this.lastActivity > SESSION_TIMEOUT - WARNING_TIME) {
        this.showSessionWarning();
      }
    }, 60000); // Check every minute
  }

  private startSessionRefresh() {
    this.refreshTimer = setInterval(async () => {
      if (this.isActive) {
        await this.refreshToken();
      }
    }, SESSION_REFRESH_INTERVAL);
  }

  private async refreshToken() {
    try {
      const auth = getFirebaseAuth();
      if (auth.currentUser) {
        // Force refresh the ID token
        await auth.currentUser.getIdToken(true);
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.handleSessionError();
    }
  }

  private showSessionWarning() {
    // Show warning 5 minutes before timeout
    if (this.warningTimer) return; // Already showing warning
    
    this.warningTimer = setTimeout(() => {
      const warning = confirm(
        'Your session will expire in 5 minutes due to inactivity. Click OK to continue or Cancel to logout.'
      );
      
      if (warning) {
        this.lastActivity = Date.now();
        this.isActive = true;
      } else {
        this.handleSessionTimeout();
      }
      
      this.warningTimer = null;
    }, 1000);
  }

  private handleSessionTimeout() {
    console.log('Session timed out due to inactivity');
    this.cleanup();
    
    // Redirect to login or show timeout message
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      auth.signOut().then(() => {
        window.location.href = '/login?reason=timeout';
      });
    }
  }

  private handleSessionError() {
    console.log('Session error occurred');
    this.cleanup();
    
    // Handle authentication errors
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      auth.signOut().then(() => {
        window.location.href = '/login?reason=error';
      });
    }
  }

  public extendSession() {
    this.lastActivity = Date.now();
    this.isActive = true;
    
    // Clear warning if showing
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  public cleanup() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  public getSessionStatus() {
    return {
      isActive: this.isActive,
      lastActivity: this.lastActivity,
      timeUntilTimeout: SESSION_TIMEOUT - (Date.now() - this.lastActivity)
    };
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Export hook for React components
export const useSessionManager = () => {
  return {
    extendSession: () => sessionManager.extendSession(),
    getSessionStatus: () => sessionManager.getSessionStatus(),
    cleanup: () => sessionManager.cleanup()
  };
};
