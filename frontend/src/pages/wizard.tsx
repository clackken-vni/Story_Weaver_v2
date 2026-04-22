'use client';

import { useState } from 'react';
import { useWizard, WizardProvider, STEPS } from '@/components/wizard/WizardProvider';
import { api } from '@/lib/api';

// Step Components
function SettingsStep() {
  const { updateStepData, stepData, currentProjectId } = useWizard();
  const [genre, setGenre] = useState<string>(stepData.settings?.genre || '');
  const [tone, setTone] = useState<string>(stepData.settings?.tone || '');
  const [targetAudience, setTargetAudience] = useState<string>(stepData.settings?.targetAudience || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!currentProjectId) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateProjectStep(currentProjectId, 'settings', { genre, tone, targetAudience });
      updateStepData('settings', { genre, tone, targetAudience });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Story Settings</h2>

      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="genre" className="block text-sm font-medium mb-2">Genre</label>
          <select
            id="genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-background"
          >
            <option value="">Select genre...</option>
            <option value="fantasy">Fantasy</option>
            <option value="romance">Romance</option>
            <option value="scifi">Sci-Fi</option>
            <option value="mystery">Mystery</option>
            <option value="horror">Horror</option>
            <option value="adventure">Adventure</option>
          </select>
        </div>

        <div>
          <label htmlFor="tone" className="block text-sm font-medium mb-2">Tone</label>
          <select
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-background"
          >
            <option value="">Select tone...</option>
            <option value="serious">Serious</option>
            <option value="humorous">Humorous</option>
            <option value="dramatic">Dramatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="whimsical">Whimsical</option>
          </select>
        </div>

        <div>
          <label htmlFor="targetAudience" className="block text-sm font-medium mb-2">Target Audience</label>
          <select
            id="targetAudience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-background"
          >
            <option value="">Select audience...</option>
            <option value="children">Children</option>
            <option value="young-adult">Young Adult</option>
            <option value="adult">Adult</option>
            <option value="all-ages">All Ages</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !genre || !tone}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function CharactersStep() {
  const { updateStepData, stepData, currentProjectId } = useWizard();
  const [characters, setCharacters] = useState<Array<{
    id: string;
    name: string;
    personality: string;
    background: string;
    motivation: string;
  }>>(stepData.characters?.characters || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCharacter = () => {
    setCharacters([
      ...characters,
      { id: crypto.randomUUID(), name: '', personality: '', background: '', motivation: '' },
    ]);
  };

  const updateCharacter = (index: number, field: string, value: string) => {
    const updated = [...characters];
    updated[index] = { ...updated[index], [field]: value };
    setCharacters(updated);
  };

  const removeCharacter = (index: number) => {
    setCharacters(characters.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!currentProjectId) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateProjectStep(currentProjectId, 'characters', { characters });
      updateStepData('characters', { characters });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save characters');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Characters</h2>
        <button
          onClick={addCharacter}
          className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
        >
          + Add Character
        </button>
      </div>

      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <p className="text-muted-foreground">
        Define your story&apos;s characters. {characters.length} character{characters.length !== 1 ? 's' : ''} added.
      </p>

      <div className="space-y-4">
        {characters.map((character, index) => (
          <div key={character.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Character {index + 1}</span>
              <button
                onClick={() => removeCharacter(index)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              placeholder="Name"
              value={character.name}
              onChange={(e) => updateCharacter(index, 'name', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <input
              type="text"
              placeholder="Personality"
              value={character.personality}
              onChange={(e) => updateCharacter(index, 'personality', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <textarea
              placeholder="Background"
              value={character.background}
              onChange={(e) => updateCharacter(index, 'background', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
              rows={2}
            />
            <input
              type="text"
              placeholder="Motivation"
              value={character.motivation}
              onChange={(e) => updateCharacter(index, 'motivation', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
      >
        {saving ? 'Saving...' : 'Save Characters'}
      </button>
    </div>
  );
}

function WorldStep() {
  const { updateStepData, stepData, currentProjectId } = useWizard();
  const [locations, setLocations] = useState<Array<{
    id: string;
    name: string;
    description: string;
  }>>(stepData.world?.locations || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLocation = () => {
    setLocations([
      ...locations,
      { id: crypto.randomUUID(), name: '', description: '' },
    ]);
  };

  const updateLocation = (index: number, field: string, value: string) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!currentProjectId) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateProjectStep(currentProjectId, 'world', { locations });
      updateStepData('world', { locations });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save world');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">World Building</h2>
        <button
          onClick={addLocation}
          className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
        >
          + Add Location
        </button>
      </div>

      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <p className="text-muted-foreground">
        Define the world of your story. {locations.length} location{locations.length !== 1 ? 's' : ''} added.
      </p>

      <div className="space-y-4">
        {locations.map((location, index) => (
          <div key={location.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Location {index + 1}</span>
              <button
                onClick={() => removeLocation(index)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              placeholder="Location name"
              value={location.name}
              onChange={(e) => updateLocation(index, 'name', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <textarea
              placeholder="Description"
              value={location.description}
              onChange={(e) => updateLocation(index, 'description', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
              rows={3}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
      >
        {saving ? 'Saving...' : 'Save World'}
      </button>
    </div>
  );
}

function OutlineStep() {
  const { updateStepData, stepData, currentProjectId } = useWizard();
  const [chapters, setChapters] = useState<Array<{
    id: string;
    title: string;
    summary: string;
  }>>(stepData.outline?.chapters || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addChapter = () => {
    setChapters([
      ...chapters,
      { id: crypto.randomUUID(), title: '', summary: '' },
    ]);
  };

  const updateChapter = (index: number, field: string, value: string) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], [field]: value };
    setChapters(updated);
  };

  const removeChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!currentProjectId) return;
    setSaving(true);
    setError(null);
    try {
      await api.updateProjectStep(currentProjectId, 'outline', { chapters });
      updateStepData('outline', { chapters });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save outline');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Story Outline</h2>
        <button
          onClick={addChapter}
          className="px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
        >
          + Add Chapter
        </button>
      </div>

      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <p className="text-muted-foreground">
        Create your story outline. {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} planned.
      </p>

      <div className="space-y-4">
        {chapters.map((chapter, index) => (
          <div key={chapter.id} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Chapter {index + 1}</span>
              <button
                onClick={() => removeChapter(index)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              placeholder="Chapter title"
              value={chapter.title}
              onChange={(e) => updateChapter(index, 'title', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            />
            <textarea
              placeholder="Chapter summary"
              value={chapter.summary}
              onChange={(e) => updateChapter(index, 'summary', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-background"
              rows={3}
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
      >
        {saving ? 'Saving...' : 'Save Outline'}
      </button>
    </div>
  );
}

function ChaptersStep() {
  const { updateStepData, stepData, currentProjectId } = useWizard();
  const [chapterContent, setChapterContent] = useState<string[]>(
    stepData.chapters?.chapters?.map(c => c.content || '') || ['']
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!currentProjectId) return;
    setSaving(true);
    setError(null);
    try {
      const chapters = chapterContent.map((content, index) => ({
        id: crypto.randomUUID(),
        number: index + 1,
        title: `Chapter ${index + 1}`,
        content,
      }));
      await api.updateProjectStep(currentProjectId, 'chapters', { chapters });
      updateStepData('chapters', { chapters });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save chapters');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Write Chapters</h2>

      {error && (
        <div className="p-4 text-red-700 bg-red-100 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <p className="text-muted-foreground">
        Write your story chapters. {chapterContent.length} chapter{chapterContent.length !== 1 ? 's' : ''}.
      </p>

      <div className="space-y-6">
        {chapterContent.map((content, index) => (
          <div key={index} className="space-y-2">
            <label className="font-medium">Chapter {index + 1}</label>
            <textarea
              value={content}
              onChange={(e) => {
                const updated = [...chapterContent];
                updated[index] = e.target.value;
                setChapterContent(updated);
              }}
              className="w-full px-3 py-2 border rounded-lg bg-background min-h-[200px]"
              placeholder="Start writing your chapter..."
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
      >
        {saving ? 'Saving...' : 'Save Chapters'}
      </button>
    </div>
  );
}

function WizardContent() {
  const { step, setStep, nextStep, prevStep, currentProjectId, setCurrentProjectId } = useWizard();
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewProject = async () => {
    if (!title.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const project = await api.createProject(title);
      setCurrentProjectId(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
    setCreating(false);
  };

  if (!currentProjectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-3xl font-bold text-center">Start Your Story</h1>
          {error && (
            <div className="p-4 text-red-700 bg-red-100 rounded-lg" role="alert">
              {error}
            </div>
          )}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your story title..."
            className="w-full px-4 py-3 text-lg border rounded-lg bg-background"
            onKeyDown={(e) => e.key === 'Enter' && createNewProject()}
          />
          <button
            onClick={createNewProject}
            disabled={creating || !title.trim()}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {creating ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <nav className="container flex items-center h-16">
          <span className="font-bold">StoryWeaver</span>
        </nav>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => setStep(s)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                aria-label={`Go to ${s} step`}
              >
                {i + 1}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  STEPS.indexOf(step) > i ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4 max-w-2xl mx-auto">
          <button
            onClick={prevStep}
            disabled={STEPS.indexOf(step) === 0}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-muted transition-colors"
          >
            Previous
          </button>
          <span className="text-lg font-medium capitalize">{step}</span>
          <button
            onClick={nextStep}
            disabled={STEPS.indexOf(step) === STEPS.length - 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-muted transition-colors"
          >
            Next
          </button>
        </div>

        <div className="max-w-2xl mx-auto bg-card p-6 rounded-lg border">
          {step === 'settings' && <SettingsStep />}
          {step === 'characters' && <CharactersStep />}
          {step === 'world' && <WorldStep />}
          {step === 'outline' && <OutlineStep />}
          {step === 'chapters' && <ChaptersStep />}
        </div>
      </main>
    </div>
  );
}

export default function WizardPage() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  );
}