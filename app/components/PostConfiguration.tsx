'use client';

export interface PostConfigurationValues {
  tone: 'professional' | 'friendly' | 'motivational' | 'humorous';
  emoji: 'yes' | 'no' | 'minimal';
  length: 'short' | 'medium' | 'long';
}

interface Props {
  values: PostConfigurationValues;
  onChange: (values: PostConfigurationValues) => void;
}

interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function OptionButton({ selected, onClick, children }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
        selected
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
      }`}
    >
      {children}
    </button>
  );
}

export function PostConfiguration({ values, onChange }: Props) {
  const handleChange = (key: keyof PostConfigurationValues, value: string) => {
    onChange({ ...values, [key]: value } as PostConfigurationValues);
  };

  return (
    <div className="space-y-4">
      {/* Tone */}
      <div>
        <label className="block text-sm font-medium mb-2">Tonas</label>
        <div className="flex flex-wrap gap-2">
          <OptionButton
            selected={values.tone === 'professional'}
            onClick={() => handleChange('tone', 'professional')}
          >
            Profesionalus
          </OptionButton>
          <OptionButton
            selected={values.tone === 'friendly'}
            onClick={() => handleChange('tone', 'friendly')}
          >
            Draugiškas
          </OptionButton>
          <OptionButton
            selected={values.tone === 'motivational'}
            onClick={() => handleChange('tone', 'motivational')}
          >
            Motyvuojantis
          </OptionButton>
          <OptionButton
            selected={values.tone === 'humorous'}
            onClick={() => handleChange('tone', 'humorous')}
          >
            Humoristinis
          </OptionButton>
        </div>
      </div>

      {/* Emoji */}
      <div>
        <label className="block text-sm font-medium mb-2">Emoji naudojimas</label>
        <div className="flex flex-wrap gap-2">
          <OptionButton
            selected={values.emoji === 'yes'}
            onClick={() => handleChange('emoji', 'yes')}
          >
            Taip
          </OptionButton>
          <OptionButton
            selected={values.emoji === 'no'}
            onClick={() => handleChange('emoji', 'no')}
          >
            Ne
          </OptionButton>
          <OptionButton
            selected={values.emoji === 'minimal'}
            onClick={() => handleChange('emoji', 'minimal')}
          >
            Minimaliai
          </OptionButton>
        </div>
      </div>

      {/* Length */}
      <div>
        <label className="block text-sm font-medium mb-2">Įrašo ilgis</label>
        <div className="flex flex-wrap gap-2">
          <OptionButton
            selected={values.length === 'short'}
            onClick={() => handleChange('length', 'short')}
          >
            Trumpas
          </OptionButton>
          <OptionButton
            selected={values.length === 'medium'}
            onClick={() => handleChange('length', 'medium')}
          >
            Vidutinis
          </OptionButton>
          <OptionButton
            selected={values.length === 'long'}
            onClick={() => handleChange('length', 'long')}
          >
            Ilgas
          </OptionButton>
        </div>
      </div>
    </div>
  );
}
