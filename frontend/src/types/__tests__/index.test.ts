import type {
  WizardStep,
  SettingsData,
  Character,
  CharactersData,
  Location,
  WorldData,
  ChapterOutline,
  OutlineData,
  Chapter,
  ChaptersData,
  StepData,
  Project,
  ApiResponse,
  User,
  AuthResponse,
} from '@/types';

describe('Type definitions', () => {
  describe('WizardStep', () => {
    it('accepts valid wizard step values', () => {
      const validSteps: WizardStep[] = ['settings', 'characters', 'world', 'outline', 'chapters'];
      expect(validSteps).toHaveLength(5);
    });
  });

  describe('SettingsData', () => {
    it('allows optional fields', () => {
      const settings: SettingsData = {};
      expect(settings.genre).toBeUndefined();
    });

    it('allows partial data', () => {
      const settings: SettingsData = {
        genre: 'fantasy',
        tone: 'dramatic',
      };
      expect(settings.genre).toBe('fantasy');
      expect(settings.tone).toBe('dramatic');
    });

    it('allows complete data', () => {
      const settings: SettingsData = {
        genre: 'fantasy',
        tone: 'dramatic',
        targetAudience: 'young-adult',
      };
      expect(settings.targetAudience).toBe('young-adult');
    });
  });

  describe('Character', () => {
    it('creates a valid character object', () => {
      const character: Character = {
        id: '1',
        name: 'Hero',
        personality: 'Brave',
        background: 'From a small village',
        motivation: 'Save the world',
      };
      expect(character.name).toBe('Hero');
    });
  });

  describe('CharactersData', () => {
    it('allows characters list', () => {
      const data: CharactersData = {
        characters: [
          { id: '1', name: 'Hero', personality: 'Brave', background: '', motivation: '' },
        ],
      };
      expect(data.characters).toHaveLength(1);
    });
  });

  describe('Location', () => {
    it('creates a valid location object', () => {
      const location: Location = {
        id: '1',
        name: 'Village',
        description: 'A peaceful village',
      };
      expect(location.name).toBe('Village');
    });
  });

  describe('WorldData', () => {
    it('allows locations list', () => {
      const data: WorldData = {
        locations: [
          { id: '1', name: 'Village', description: '' },
        ],
      };
      expect(data.locations).toHaveLength(1);
    });
  });

  describe('ChapterOutline', () => {
    it('creates a valid chapter outline', () => {
      const outline: ChapterOutline = {
        id: '1',
        title: 'The Beginning',
        summary: 'Hero starts journey',
      };
      expect(outline.title).toBe('The Beginning');
    });
  });

  describe('OutlineData', () => {
    it('allows chapter outlines', () => {
      const data: OutlineData = {
        chapters: [
          { id: '1', title: 'Chapter 1', summary: '' },
        ],
      };
      expect(data.chapters).toHaveLength(1);
    });
  });

  describe('Chapter', () => {
    it('creates a valid chapter', () => {
      const chapter: Chapter = {
        id: '1',
        number: 1,
        title: 'Introduction',
        content: 'Once upon a time...',
      };
      expect(chapter.content).toBe('Once upon a time...');
    });
  });

  describe('ChaptersData', () => {
    it('allows chapters list', () => {
      const data: ChaptersData = {
        chapters: [
          { id: '1', number: 1, title: 'Ch 1', content: '' },
        ],
      };
      expect(data.chapters).toHaveLength(1);
    });
  });

  describe('StepData', () => {
    it('allows all step data types', () => {
      const data: StepData = {
        settings: { genre: 'fantasy' },
        characters: { characters: [] },
        world: { locations: [] },
        outline: { chapters: [] },
        chapters: { chapters: [] },
      };
      expect(data.settings?.genre).toBe('fantasy');
    });

    it('allows partial step data', () => {
      const data: StepData = {
        settings: { genre: 'fantasy' },
      };
      expect(data.world).toBeUndefined();
    });
  });

  describe('Project', () => {
    it('creates a valid project object', () => {
      const project: Project = {
        id: '1',
        userId: 'user1',
        title: 'My Story',
        currentStep: 'settings',
        stepData: {},
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      expect(project.title).toBe('My Story');
    });

    it('allows different current steps', () => {
      const project: Project = {
        id: '1',
        userId: 'user1',
        title: 'My Story',
        currentStep: 'characters',
        stepData: {},
        createdAt: '',
        updatedAt: '',
      };
      expect(project.currentStep).toBe('characters');
    });
  });

  describe('ApiResponse', () => {
    it('allows success response', () => {
      const response: ApiResponse<string> = {
        success: true,
        data: 'test',
      };
      expect(response.success).toBe(true);
      expect(response.data).toBe('test');
    });

    it('allows error response', () => {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Something went wrong',
      };
      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
    });

    it('allows paginated response', () => {
      const response: ApiResponse<number[]> = {
        success: true,
        data: [1, 2, 3],
        meta: {
          total: 100,
          page: 1,
          limit: 10,
        },
      };
      expect(response.meta?.total).toBe(100);
    });
  });

  describe('User', () => {
    it('creates a valid user object', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
      };
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('AuthResponse', () => {
    it('creates a valid auth response', () => {
      const response: AuthResponse = {
        user: { id: '1', email: 'test@example.com' },
        access_token: 'token123',
        refresh_token: 'refresh123',
      };
      expect(response.access_token).toBe('token123');
    });
  });
});