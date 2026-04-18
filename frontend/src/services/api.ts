import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { User, APIAnnotation, Comment } from '../types';

const BASE_URL = 'http://localhost:8000/api/v1';

const axiosConfig: Partial<InternalAxiosRequestConfig> = {
  baseURL: BASE_URL,
};

// If running inside a chrome extension, route requests through background worker to bypass CSP
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
  axiosConfig.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    return new Promise((resolve, reject) => {
      // Build full URL
      let fullUrl = config.url || '';
      if (config.baseURL && !fullUrl.startsWith('http')) {
        fullUrl = config.baseURL.replace(/\/$/, '') + '/' + fullUrl.replace(/^\//, '');
      }

      // Safely convert AxiosHeaders to a plain object for serialization over chrome IPC
      const plainHeaders: Record<string, string> = {};
      if (config.headers) {
        for (const key in config.headers) {
          if (typeof config.headers[key] === 'string' || typeof config.headers[key] === 'number') {
            plainHeaders[key] = String(config.headers[key]);
          }
        }
      }
      
      // Ensure Content-Type is set for JSON payloads
      if (config.data && typeof config.data === 'object') {
        if (!plainHeaders['Content-Type'] && !plainHeaders['content-type']) {
          plainHeaders['Content-Type'] = 'application/json';
        }
      }

      chrome.runtime.sendMessage({
        action: 'PROXY_REQUEST',
        config: {
          url: fullUrl,
          method: config.method || 'get',
          headers: plainHeaders,
          data: config.data,
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response || response.error) {
           reject(Object.assign(new Error(response?.error || 'Unknown network error'), {
             response: { status: response?.status || 0, data: response?.data }
           }));
           return;
        }
        
        // Axios expects this format for responses
        resolve({
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          config: config,
          request: {} // Dummy request object
        });
      });
    });
  };
}

export const api = axios.create(axiosConfig);

// Helper to handle both chrome.storage and localStorage (for dev/web fallback)
const getStorage = () => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return {
      get: (key: string): Promise<string | null> => new Promise((resolve) => {
        chrome.storage.local.get([key], (result: { [key: string]: unknown }) => {
          if (chrome.runtime.lastError) {
            console.error("Storage Error:", chrome.runtime.lastError);
            resolve(null);
          } else {
            resolve((result[key] as string) || null);
          }
        });
      }),
      set: (key: string, value: string): Promise<boolean> => new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
          resolve(true);
        });
      }),
      remove: (key: string): Promise<boolean> => new Promise((resolve) => {
        chrome.storage.local.remove(key, () => {
          resolve(true);
        });
      })
    };
  }
  // Fallback for development outside extension environment
  console.warn("Chrome storage not available, falling back to localStorage");
  return {
    get: async (key: string): Promise<string | null> => localStorage.getItem(key),
    set: async (key: string, value: string): Promise<void> => { localStorage.setItem(key, value); },
    remove: async (key: string): Promise<void> => { localStorage.removeItem(key); }
  };
};


const storage = getStorage();

api.interceptors.request.use(async (config) => {
  const token = await storage.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.remove('token');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (username: string, email: string, password: string): Promise<User> => {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },
  login: async (username: string, password: string): Promise<{ access_token: string }> => {
    const data = new URLSearchParams();
    data.append('username', username);
    data.append('password', password);
    
    // We send it as a string so the background script can safely serialize and transmit it
    const response = await api.post('/auth/login', data.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    await storage.set('token', response.data.access_token);
    return response.data;
  },
  logout: async (): Promise<void> => {
    await storage.remove('token');
  },
  isAuthenticated: async (): Promise<boolean> => {
    const token = await storage.get('token');
    return !!token;
  },
  me: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const annotationsService = {
  getAnnotations: async (url: string): Promise<APIAnnotation[]> => {
    const response = await api.get(`/annotations?url=${encodeURIComponent(url)}`);
    return response.data;
  },
  createAnnotation: async (data: { url: string, text_selector: string, selected_text: string, initial_comment: string }): Promise<APIAnnotation> => {
    const response = await api.post('/annotations', data);
    return response.data;
  }
};

export const commentsService = {
  addCommentToAnnotation: async (annotationId: number, content: string): Promise<Comment> => {
    const response = await api.post(`/annotations/${annotationId}/comments`, { content });
    return response.data;
  },
  replyToComment: async (parentId: number, content: string): Promise<Comment> => {
    const response = await api.post(`/comments/${parentId}/reply`, { content });
    return response.data;
  },
  updateComment: async (id: number, content: string): Promise<Comment> => {
    const response = await api.put(`/comments/${id}`, { content });
    return response.data;
  },
  deleteComment: async (id: number): Promise<void> => {
    await api.delete(`/comments/${id}`);
  }
};


