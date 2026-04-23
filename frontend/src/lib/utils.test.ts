import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'is-true', false && 'is-false')).toBe('base is-true');
  });

  it('correctly merges tailwind classes', () => {
    // tailwind-merge should favor the last color class
    expect(cn('p-4 p-2')).toBe('p-2');
    expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
  });
});
