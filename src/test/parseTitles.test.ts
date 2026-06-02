import { describe, it, expect } from 'vitest';
import { parseTitlesApiJson } from '@/lib/linkedin/parseTitles';

describe('parseTitlesApiJson', () => {
  it('extracts localized names from a LinkedIn /v2/titles response', () => {
    const json = JSON.stringify({
      elements: [
        { id: 1, name: { localized: { en_US: 'Software Engineer' } } },
        { id: 2, name: { localized: { en_US: 'Marketing Manager' } } },
      ],
    });
    expect(parseTitlesApiJson(json)).toEqual(['Software Engineer', 'Marketing Manager']);
  });

  it('falls back to the first localized value when en_US is absent', () => {
    const json = JSON.stringify({
      elements: [{ id: 3, name: { localized: { fr_FR: 'Ingénieur' } } }],
    });
    expect(parseTitlesApiJson(json)).toEqual(['Ingénieur']);
  });

  it('de-duplicates titles', () => {
    const json = JSON.stringify({
      elements: [
        { name: { localized: { en_US: 'Sales Director' } } },
        { name: { localized: { en_US: 'Sales Director' } } },
      ],
    });
    expect(parseTitlesApiJson(json)).toEqual(['Sales Director']);
  });

  it('returns an empty array for invalid JSON', () => {
    expect(parseTitlesApiJson('not json')).toEqual([]);
  });
});
