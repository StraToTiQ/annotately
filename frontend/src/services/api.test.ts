import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

// Mock localStorage for node environment
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

import { api, authService, annotationsService, commentsService } from './api';

// Mock the axios instance methods
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }))
    }
  };
});



describe('API Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authService', () => {
    it('register should call api.post with correct data', async () => {
      const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      (api.post as Mock).mockResolvedValueOnce({ data: mockUser });

      const result = await authService.register('testuser', 'test@example.com', 'password');
      
      expect(api.post).toHaveBeenCalledWith('/auth/register', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password'
      });
      expect(result).toEqual(mockUser);
    });

    it('login should format data as URLSearchParams and set token', async () => {
      const mockToken = { access_token: 'fake-token' };
      (api.post as Mock).mockResolvedValueOnce({ data: mockToken });

      const result = await authService.login('testuser', 'password');
      
      expect(api.post).toHaveBeenCalledWith(
        '/auth/login', 
        'username=testuser&password=password', 
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'fake-token');
      expect(result).toEqual(mockToken);
    });
  });

  describe('annotationsService', () => {
    it('getAnnotations should call api.get with URL encoded param', async () => {
      const mockData = [{ id: 1, selected_text: 'test' }];
      (api.get as Mock).mockResolvedValueOnce({ data: mockData });

      const url = 'http://example.com/page?query=1';
      const result = await annotationsService.getAnnotations(url);
      
      expect(api.get).toHaveBeenCalledWith(`/annotations?url=${encodeURIComponent(url)}`);
      expect(result).toEqual(mockData);
    });
  });

  describe('commentsService', () => {
    it('addCommentToAnnotation should POST to annotations endpoint', async () => {
      (api.post as Mock).mockResolvedValueOnce({ data: { id: 2, content: 'new' } });

      await commentsService.addCommentToAnnotation(5, 'new root comment');
      
      expect(api.post).toHaveBeenCalledWith('/annotations/5/comments', { content: 'new root comment' });
    });
  });
});
