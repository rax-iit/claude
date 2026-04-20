'use client';

import { AnnotationRatings, RatingValue, RATING_DIMENSIONS, RatingKey } from '@/lib/schema';

interface Props {
  ratings: AnnotationRatings;
  onRatingChange: (key: RatingKey, value: RatingValue) => void;
  overallStrength: 'SLIGHTLY' | 'MUCH' | null;
  onStrengthChange: (v: 'SLIGHTLY' | 'MUCH' | null) => void;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  onConfidenceChange: (v: 'LOW' | 'MEDIUM' | 'HIGH' | null) => void;
  rationale: string;
  onRationaleChange: (v: string) => void;
  errors: string[];
  leftLabel: string;
  rightLabel: string;
  disabled?: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  quality: 'Image Quality',
  alignment: 'Prompt Alignment',
  overall: 'Overall Preference',
};

function RatingButton({
  value,
  selected,
  onClick,
  label,
  color,
  disabled,
}: {
  value: RatingValue;
  selected: boolean;
  onClick: () => void;
  label: string;
  color: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`
        flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-card
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}
        ${selected ? `${color} text-white shadow-lg` : 'bg-surface-raised text-gray-400 border border-surface-border hover:border-gray-500'}
      `}
    >
      {label}
    </button>
  );
}

function RatingRow({
  dimKey,
  label,
  value,
  onChange,
  leftLabel,
  rightLabel,
  disabled,
  highlight,
}: {
  dimKey: RatingKey;
  label: string;
  value: RatingValue | null;
  onChange: (v: RatingValue) => void;
  leftLabel: string;
  rightLabel: string;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${
        highlight ? 'bg-surface-raised/60' : ''
      }`}
      role="group"
      aria-labelledby={`dim-label-${dimKey}`}
    >
      <span
        id={`dim-label-${dimKey}`}
        className="w-44 shrink-0 text-sm text-gray-300"
      >
        {label}
      </span>
      <div className="flex gap-1.5 flex-1" role="radiogroup">
        <RatingButton
          value="LEFT"
          selected={value === 'LEFT'}
          onClick={() => onChange('LEFT')}
          label={leftLabel}
          color="bg-indigo-600"
          disabled={disabled}
        />
        <RatingButton
          value="TIE"
          selected={value === 'TIE'}
          onClick={() => onChange('TIE')}
          label="Tie"
          color="bg-amber-600"
          disabled={disabled}
        />
        <RatingButton
          value="RIGHT"
          selected={value === 'RIGHT'}
          onClick={() => onChange('RIGHT')}
          label={rightLabel}
          color="bg-violet-600"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export default function AnnotationForm({
  ratings,
  onRatingChange,
  overallStrength,
  onStrengthChange,
  confidence,
  onConfidenceChange,
  rationale,
  onRationaleChange,
  errors,
  leftLabel,
  rightLabel,
  disabled,
}: Props) {
  const sections = ['quality', 'alignment', 'overall'];

  return (
    <div className="space-y-4">
      {errors.length > 0 && (
        <div
          role="alert"
          className="bg-red-900/30 border border-red-700/60 rounded-lg p-3 text-sm text-red-300 space-y-1"
        >
          {errors.map((e, i) => (
            <p key={i}>• {e}</p>
          ))}
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center gap-3 px-3">
        <span className="w-44 shrink-0" />
        <div className="flex gap-1.5 flex-1 text-xs font-bold text-center">
          <span className="flex-1 text-indigo-400">{leftLabel}</span>
          <span className="flex-1 text-amber-400">Tie / Equal</span>
          <span className="flex-1 text-violet-400">{rightLabel}</span>
        </div>
      </div>

      {sections.map((section) => {
        const dims = RATING_DIMENSIONS.filter((d) => d.section === section);
        return (
          <div key={section} className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-surface-border bg-surface-raised/60">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                {SECTION_LABELS[section]}
                {section !== 'quality' ? null : (
                  <span className="ml-2 text-gray-600 normal-case tracking-normal font-normal">
                    (3 sub-dimensions)
                  </span>
                )}
              </h3>
            </div>
            <div className="divide-y divide-surface-border/50 py-1">
              {dims.map((d) => (
                <RatingRow
                  key={d.key}
                  dimKey={d.key}
                  label={d.label}
                  value={ratings[d.key]}
                  onChange={(v) => onRatingChange(d.key, v)}
                  leftLabel={leftLabel}
                  rightLabel={rightLabel}
                  disabled={disabled}
                  highlight={d.key === 'overall_preference'}
                />
              ))}
            </div>

            {/* Overall strength selector */}
            {section === 'overall' &&
              ratings.overall_preference &&
              ratings.overall_preference !== 'TIE' && (
                <div className="px-3 pb-3 pt-1 border-t border-surface-border/50">
                  <p className="text-xs text-gray-500 mb-2">
                    How strong is the preference?
                    <span className="ml-1 text-gray-600">(optional)</span>
                  </p>
                  <div className="flex gap-2">
                    {(['SLIGHTLY', 'MUCH'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => onStrengthChange(overallStrength === s ? null : s)}
                        disabled={disabled}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all border
                          ${
                            overallStrength === s
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-surface-raised border-surface-border text-gray-400 hover:border-gray-500'
                          }
                          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {s === 'SLIGHTLY' ? 'Slightly better' : 'Much better'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>
        );
      })}

      {/* Optional: confidence + rationale */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4 space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-2">
            Confidence <span className="text-gray-600 normal-case tracking-normal font-normal">(optional)</span>
          </label>
          <div className="flex gap-2">
            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onConfidenceChange(confidence === c ? null : c)}
                disabled={disabled}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
                  ${
                    confidence === c
                      ? c === 'LOW'
                        ? 'bg-red-700 border-red-600 text-white'
                        : c === 'MEDIUM'
                        ? 'bg-yellow-700 border-yellow-600 text-white'
                        : 'bg-green-700 border-green-600 text-white'
                      : 'bg-surface-raised border-surface-border text-gray-400 hover:border-gray-500'
                  }
                  ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="rationale"
            className="text-xs font-semibold uppercase tracking-widest text-gray-400 block mb-2"
          >
            Rationale <span className="text-gray-600 normal-case tracking-normal font-normal">(optional)</span>
          </label>
          <textarea
            id="rationale"
            value={rationale}
            onChange={(e) => onRationaleChange(e.target.value)}
            disabled={disabled}
            placeholder="Any observations or reasoning for your choices…"
            rows={3}
            className="w-full bg-surface-raised border border-surface-border rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 disabled:opacity-40"
          />
        </div>
      </div>
    </div>
  );
}
