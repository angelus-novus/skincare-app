'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Heart, Target, Bell, Download, Trash2, ChevronRight, Check, Sparkles } from 'lucide-react';
import { useAppStore, useUserProfile } from '@/lib/store';
import type { SkinType, SkinConcern } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { concernLabel, cn } from '@/lib/utils';

const SKIN_TYPES: { value: SkinType; label: string; description: string; emoji: string }[] = [
  { value: 'normal', label: 'Normal', description: 'Balanced oil and hydration, minimal blemishes', emoji: '✨' },
  { value: 'dry', label: 'Dry', description: 'Tight, flaky, or rough. Needs lots of moisture', emoji: '🌵' },
  { value: 'oily', label: 'Oily', description: 'Shiny, prone to enlarged pores and breakouts', emoji: '💧' },
  { value: 'combination', label: 'Combination', description: 'Oily T-zone, normal or dry cheeks', emoji: '☯️' },
  { value: 'sensitive', label: 'Sensitive', description: 'Reactive, easily irritated, prone to redness', emoji: '🌸' },
];

const ALL_CONCERNS: SkinConcern[] = [
  'acne', 'hyperpigmentation', 'anti-aging', 'dryness', 'sensitivity',
  'redness', 'pores', 'texture', 'dullness', 'dark-circles', 'fine-lines', 'firmness',
];

const CONCERN_EMOJIS: Record<SkinConcern, string> = {
  acne: '😤', hyperpigmentation: '🟤', 'anti-aging': '⏰', dryness: '🌵',
  sensitivity: '🌸', redness: '🔴', pores: '🔬', texture: '🪨',
  dullness: '😴', 'dark-circles': '🌑', 'fine-lines': '〰️', firmness: '💪',
};

const BUDGET_OPTIONS = [
  { value: 'budget', label: 'Budget', description: 'Under $30 per product', emoji: '💰' },
  { value: 'mid-range', label: 'Mid-range', description: '$30–$80 per product', emoji: '💳' },
  { value: 'luxury', label: 'Luxury', description: '$80+ per product', emoji: '👑' },
  { value: 'mixed', label: 'Mix it up', description: 'No preference — best for my skin', emoji: '🎲' },
] as const;

const PROCEDURE_OPTIONS = [
  { value: 'laser', label: 'Laser Treatments', emoji: '⚡' },
  { value: 'injectables', label: 'Botox / Filler', emoji: '💉' },
  { value: 'facials', label: 'Facials / HydraFacial', emoji: '✨' },
  { value: 'peels', label: 'Chemical Peels', emoji: '🧴' },
  { value: 'microneedling', label: 'Microneedling', emoji: '🔬' },
  { value: 'light-therapy', label: 'LED Light Therapy', emoji: '💡' },
];

// Onboarding Wizard
function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const { completeOnboarding } = useAppStore();
  const [data, setData] = useState({
    name: '',
    skinType: '' as SkinType | '',
    skinConcerns: [] as SkinConcern[],
    allergies: [] as string[],
    budget: 'mixed' as string,
    goals: '',
    procedureInterests: [] as string[],
  });
  const [allergyInput, setAllergyInput] = useState('');

  const steps = [
    { title: 'Welcome to GlowShelf', subtitle: 'Tell us a little about yourself' },
    { title: 'Your Skin Type', subtitle: 'Select the one that best describes your skin' },
    { title: 'Skin Concerns & Goals', subtitle: 'What would you like to improve?' },
    { title: 'Preferences & Sensitivities', subtitle: 'Help us personalize your experience' },
  ];

  const toggleConcern = (c: SkinConcern) =>
    setData((d) => ({
      ...d,
      skinConcerns: d.skinConcerns.includes(c) ? d.skinConcerns.filter((x) => x !== c) : [...d.skinConcerns, c],
    }));

  const toggleProcedure = (p: string) =>
    setData((d) => ({
      ...d,
      procedureInterests: d.procedureInterests.includes(p) ? d.procedureInterests.filter((x) => x !== p) : [...d.procedureInterests, p],
    }));

  const addAllergy = () => {
    if (!allergyInput.trim()) return;
    setData((d) => ({ ...d, allergies: [...d.allergies, allergyInput.trim()] }));
    setAllergyInput('');
  };

  const handleComplete = () => {
    completeOnboarding({
      name: data.name,
      skinType: (data.skinType || 'combination') as SkinType,
      skinConcerns: data.skinConcerns,
      allergies: data.allergies,
      budget: data.budget as 'budget' | 'mid-range' | 'luxury' | 'mixed',
      goals: data.goals.split('\n').filter(Boolean),
      procedureInterests: data.procedureInterests,
    });
    onComplete();
  };

  const canNext = [
    data.name.trim().length > 0,
    data.skinType !== '',
    data.skinConcerns.length > 0,
    true,
  ][step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={cn('h-1.5 rounded-full transition-all duration-500', i === step ? 'w-12 bg-rose-500' : i < step ? 'w-6 bg-rose-300' : 'w-6 bg-rose-100')} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{steps[step].title}</h1>
              <p className="text-slate-500">{steps[step].subtitle}</p>
            </div>

            {/* Step 0: Name */}
            {step === 0 && (
              <Card>
                <CardBody className="space-y-6 p-8">
                  <div className="text-center text-6xl mb-4">🌿</div>
                  <p className="text-slate-600 text-center text-sm leading-relaxed">
                    GlowShelf is your personal skincare companion — track products, discover ingredients, get AI-powered insights, and build routines that actually work for <em>your</em> skin.
                  </p>
                  <Input
                    label="Your name"
                    placeholder="e.g. Sofia"
                    value={data.name}
                    onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && canNext && setStep(1)}
                  />
                </CardBody>
              </Card>
            )}

            {/* Step 1: Skin type */}
            {step === 1 && (
              <div className="grid grid-cols-1 gap-3">
                {SKIN_TYPES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setData((d) => ({ ...d, skinType: s.value }))}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all',
                      data.skinType === s.value
                        ? 'border-rose-400 bg-rose-50 shadow-md'
                        : 'border-slate-100 bg-white hover:border-rose-200'
                    )}
                  >
                    <span className="text-3xl">{s.emoji}</span>
                    <div>
                      <div className="font-semibold text-slate-800">{s.label}</div>
                      <div className="text-sm text-slate-500">{s.description}</div>
                    </div>
                    {data.skinType === s.value && (
                      <Check className="w-5 h-5 text-rose-500 ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Concerns */}
            {step === 2 && (
              <Card>
                <CardBody className="p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Select your main concerns (choose all that apply)</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {ALL_CONCERNS.map((c) => (
                        <button
                          key={c}
                          onClick={() => toggleConcern(c)}
                          className={cn(
                            'flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm transition-all',
                            data.skinConcerns.includes(c)
                              ? 'border-rose-400 bg-rose-50 text-rose-700 font-medium'
                              : 'border-slate-100 bg-white text-slate-600 hover:border-rose-200'
                          )}
                        >
                          <span>{CONCERN_EMOJIS[c]}</span>
                          {concernLabel(c)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Your skin goals</h3>
                    <Textarea
                      placeholder="e.g. Even out my skin tone, reduce breakouts, prevent early aging..."
                      value={data.goals}
                      onChange={(e) => setData((d) => ({ ...d, goals: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <div className="space-y-4">
                <Card>
                  <CardBody className="p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Budget preference</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {BUDGET_OPTIONS.map((b) => (
                        <button
                          key={b.value}
                          onClick={() => setData((d) => ({ ...d, budget: b.value }))}
                          className={cn(
                            'flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all',
                            data.budget === b.value ? 'border-rose-400 bg-rose-50' : 'border-slate-100 bg-white hover:border-rose-200'
                          )}
                        >
                          <span className="text-xl">{b.emoji}</span>
                          <div>
                            <div className="text-sm font-semibold text-slate-700">{b.label}</div>
                            <div className="text-xs text-slate-400">{b.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-1">Known allergies or irritants</h3>
                    <p className="text-xs text-slate-400 mb-3">e.g. fragrance, lanolin, benzoyl peroxide</p>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Type and press Add..."
                        value={allergyInput}
                        onChange={(e) => setAllergyInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                      />
                      <Button size="sm" variant="secondary" onClick={addAllergy}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.allergies.map((a, i) => (
                        <span key={i} className="bg-red-50 text-red-600 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
                          {a}
                          <button onClick={() => setData((d) => ({ ...d, allergies: d.allergies.filter((_, j) => j !== i) }))}>×</button>
                        </span>
                      ))}
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody className="p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Open to these procedures?</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {PROCEDURE_OPTIONS.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => toggleProcedure(p.value)}
                          className={cn(
                            'flex items-center gap-2 p-2.5 rounded-xl border-2 text-sm transition-all text-left',
                            data.procedureInterests.includes(p.value) ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-100 bg-white text-slate-600 hover:border-rose-200'
                          )}
                        >
                          <span>{p.emoji}</span> {p.label}
                        </button>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} className={step === 0 ? 'invisible' : ''}>
            ← Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              <Sparkles className="w-4 h-4" />
              Let's Go!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Settings page (post-onboarding)
function SettingsContent() {
  const profile = useUserProfile();
  const { updateUserProfile } = useAppStore();
  const [name, setName] = useState(profile.name);
  const [skinType, setSkinType] = useState<SkinType>(profile.skinType);
  const [concerns, setConcerns] = useState<SkinConcern[]>(profile.skinConcerns);
  const [allergies, setAllergies] = useState<string[]>(profile.allergies);
  const [allergyInput, setAllergyInput] = useState('');
  const [budget, setBudget] = useState(profile.budget || 'mixed');
  const [saved, setSaved] = useState(false);

  const toggleConcern = (c: SkinConcern) =>
    setConcerns((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const addAllergy = () => {
    if (!allergyInput.trim()) return;
    setAllergies((prev) => [...prev, allergyInput.trim()]);
    setAllergyInput('');
  };

  const save = () => {
    updateUserProfile({ name, skinType, skinConcerns: concerns, allergies, budget: budget as 'budget' | 'mid-range' | 'luxury' | 'mixed' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-slate-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-4 h-4 text-rose-400" /> Profile</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-300 flex items-center justify-center text-2xl text-white font-bold flex-shrink-0">
                {name ? name[0].toUpperCase() : '?'}
              </div>
              <Input
                label="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardBody>
        </Card>

        {/* Skin Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /> Skin Profile</CardTitle>
          </CardHeader>
          <CardBody className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Skin Type</label>
              <div className="grid grid-cols-5 gap-2">
                {SKIN_TYPES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSkinType(s.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs transition-all',
                      skinType === s.value ? 'border-rose-400 bg-rose-50 text-rose-700 font-semibold' : 'border-slate-100 bg-white text-slate-600 hover:border-rose-200'
                    )}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Skin Concerns</label>
              <div className="flex flex-wrap gap-2">
                {ALL_CONCERNS.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleConcern(c)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border-2 transition-all',
                      concerns.includes(c) ? 'border-rose-400 bg-rose-50 text-rose-700 font-medium' : 'border-slate-200 text-slate-500 hover:border-rose-200'
                    )}
                  >
                    {CONCERN_EMOJIS[c]} {concernLabel(c)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Known Allergies & Irritants</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Type and press Add..."
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addAllergy()}
                />
                <Button size="sm" variant="secondary" onClick={addAllergy}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allergies.map((a, i) => (
                  <span key={i} className="bg-red-50 text-red-600 text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
                    {a}
                    <button onClick={() => setAllergies((prev) => prev.filter((_, j) => j !== i))}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="w-4 h-4 text-rose-400" /> Preferences</CardTitle>
          </CardHeader>
          <CardBody>
            <label className="text-sm font-medium text-slate-700 block mb-3">Budget Preference</label>
            <div className="grid grid-cols-2 gap-2">
              {BUDGET_OPTIONS.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setBudget(b.value)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all',
                    budget === b.value ? 'border-rose-400 bg-rose-50' : 'border-slate-100 hover:border-rose-200'
                  )}
                >
                  <span className="text-xl">{b.emoji}</span>
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{b.label}</div>
                    <div className="text-xs text-slate-400">{b.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Download className="w-4 h-4 text-slate-400" /> Data</CardTitle>
          </CardHeader>
          <CardBody className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" /> Export Data
            </Button>
            <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Reset App Data
            </Button>
          </CardBody>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={save} className="min-w-32">
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const profile = useUserProfile();
  const [onboardingDone, setOnboardingDone] = useState(profile.onboarded);

  if (!onboardingDone) {
    return <OnboardingWizard onComplete={() => setOnboardingDone(true)} />;
  }
  return <SettingsContent />;
}
