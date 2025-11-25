import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Settings, Save, RotateCcw } from 'lucide-react';

export function SettingsPanel() {
  const { state, updateCustomSystemPrompt } = useGame();
  const [isEditing, setIsEditing] = useState(false);
  const [prompt, setPrompt] = useState(state.session?.custom_system_prompt || '');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setPrompt(state.session?.custom_system_prompt || '');
  }, [state.session?.custom_system_prompt]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateCustomSystemPrompt(prompt);
    setIsSaving(false);
    setIsEditing(false);
  };

  const hasCustomPrompt = state.session?.custom_system_prompt;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">AI Settings</h2>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom System Prompt
            </label>
            <p className="text-xs text-gray-400 mb-2">
              This prompt will be sent to the AI before every narrative generation. Leave empty to use the default game prompt.
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your custom system prompt here..."
              className="w-full h-64 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setPrompt(state.session?.custom_system_prompt || '');
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">
            {hasCustomPrompt ? (
              <>
                <span className="text-green-400 font-medium">Custom prompt active</span>
                <span className="text-gray-500 mx-2">•</span>
                {prompt.length} characters
              </>
            ) : (
              <span className="text-gray-500">Using default game prompt</span>
            )}
          </p>
          {hasCustomPrompt && (
            <div className="bg-gray-800 border border-gray-700 rounded p-3 max-h-32 overflow-y-auto">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                {prompt.substring(0, 200)}{prompt.length > 200 && '...'}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Danger Zone</h3>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to start a new game? This will erase your current progress and cannot be undone!')) {
              localStorage.removeItem('gameSessionToken');
              window.location.reload();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Start New Game
        </button>
        <p className="text-xs text-gray-500 mt-2">
          This will permanently delete your current character and all progress.
        </p>
      </div>
    </div>
  );
}
