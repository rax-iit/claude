# Image Preference Annotation Tool

A production-quality web interface for pairwise (A/B) preference evaluation of AI-generated images.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Adding Your Dataset

Place a JSONL file at `data/tasks.jsonl`. Each line is one comparison task:

```jsonl
{"pair_id":"p_000001","prompt":"A cinematic portrait...","image_a_url":"/images/p_000001_a.png","image_b_url":"/images/p_000001_b.png","hidden_meta":{"model_a":"checkpoint_A_v12","model_b":"checkpoint_B_v07","seed":1234,"sampler":"dpmpp_2m","steps":30,"cfg":7.0,"resolution":"1024x1024"}}
```

**Or** upload via the Admin page at http://localhost:3000/admin.

### Local images

Place images in `public/images/` and reference them as `/images/filename.png`.

### Remote images

Use full URLs: `https://your-cdn.com/image.png`

---

## Results

Annotations are appended to `data/results.jsonl` as they are submitted.

Export at any time from `/admin`:
- **JSONL** → `GET /api/export/jsonl`
- **CSV** → `GET /api/export/csv`

---

## Architecture

```
app/
  page.tsx              — Annotator ID entry (home)
  task/page.tsx         — Main annotation interface
  admin/page.tsx        — Admin dashboard (stats, upload, export)
  api/
    next-task/          — GET next unannotated task for session
    submit/             — POST annotation result
    export/jsonl/       — GET results as JSONL
    export/csv/         — GET results as CSV
    stats/              — GET aggregate statistics
    upload/             — POST new tasks.jsonl

components/
  ImagePanel.tsx        — Zoomable/pannable image with fullscreen
  AnnotationForm.tsx    — Rubric form (5 dimensions, LEFT/TIE/RIGHT)
  PromptCard.tsx        — Prompt display with copy button
  SkipModal.tsx         — Skip flow with reason selection
  ReportModal.tsx       — Report problem flow
  KeyboardShortcutsHelp.tsx

lib/
  schema.ts             — Zod schemas + TypeScript types
  randomization.ts      — Side assignment logic
  storage.ts            — File-based persistence (tasks.jsonl, results.jsonl)
  stats.ts              — Win-rate computation
  export.ts             — JSONL + CSV serialization

data/
  tasks.jsonl           — Input task pairs (edit or upload via admin)
  results.jsonl         — Append-only annotation output (auto-created)
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Rate Image A better (Overall) |
| `2` | Rate Tie / Equal (Overall) |
| `3` | Rate Image B better (Overall) |
| `N` or `Enter` | Submit & load next task |
| `S` | Open skip dialog |
| `R` | Open report problem dialog |
| `Z` | Toggle sync zoom/pan between panels |
| `W` | Swap displayed image sides (viewing comfort only) |
| `F` | Fullscreen left panel |
| `G` | Fullscreen right panel |
| `?` | Toggle keyboard shortcuts help |

---

## Data Schema

### Input: `data/tasks.jsonl`

```typescript
{
  pair_id: string;
  prompt: string;
  image_a_url: string;   // /images/local.png  or  https://remote.url/image.png
  image_b_url: string;
  hidden_meta: {
    model_a: string;
    model_b: string;
    seed?: number;
    sampler?: string;
    steps?: number;
    cfg?: number;
    resolution?: string;
  };
}
```

### Output: `data/results.jsonl`

```typescript
{
  pair_id: string;
  annotation_id: string;          // UUID
  annotator_id: string;           // From localStorage
  timestamp_utc: string;          // ISO-8601
  prompt: string;                 // Copy of prompt for traceability
  side_assignment: {
    left_shown: "A" | "B";        // Which underlying image was initially on left
    right_shown: "A" | "B";
    left_source_model: string;    // hidden_meta.model_a or model_b
    right_source_model: string;
  };
  view_swapped: boolean;          // True if annotator used Swap Sides button
  ratings: {
    quality_realism:     "LEFT" | "TIE" | "RIGHT" | null;
    quality_composition: "LEFT" | "TIE" | "RIGHT" | null;
    quality_artifacts:   "LEFT" | "TIE" | "RIGHT" | null;
    prompt_alignment:    "LEFT" | "TIE" | "RIGHT" | null;
    overall_preference:  "LEFT" | "TIE" | "RIGHT" | null;
  };
  overall_strength: "SLIGHTLY" | "MUCH" | null;
  confidence: "LOW" | "MEDIUM" | "HIGH" | null;
  rationale: string | null;
  flags: {
    skipped: boolean;
    skip_reason: "CORRUPTED_IMAGE" | "PROMPT_UNCLEAR" | "IMAGES_IDENTICAL" | "UNSAFE_CONTENT" | "OTHER" | null;
    reported_problem: boolean;
    problem_type: string | null;
    problem_notes: string | null;
  };
  hidden_meta: { ... }            // Full copy of input hidden_meta
}
```

### Normalizing results for analysis

When computing per-model win rates, account for both `side_assignment` and `view_swapped`:

```python
def effective_winner(row):
    rating = row['overall_preference']  # LEFT / TIE / RIGHT
    if row['view_swapped']:
        # Annotator saw images swapped; invert LEFT/RIGHT
        rating = 'RIGHT' if rating == 'LEFT' else ('LEFT' if rating == 'RIGHT' else 'TIE')
    if rating == 'TIE':
        return 'TIE'
    winner_position = row['left_shown'] if rating == 'LEFT' else row['right_shown']
    return row[f'{winner_position.lower()}_source_model']
```

---

## Running Tests

```bash
npm test
```

Tests cover:
- `randomization.test.ts` — Side assignment logic and 50/50 distribution
- `validation.test.ts` — Annotation validation (required fields, skip flow)
- `export.test.ts` — JSONL/CSV serialization including escaping edge cases

---

## Production Build

```bash
npm run build
npm start
```

For multi-annotator deployments, replace `data/results.jsonl` with a proper database write path or use a shared network drive. The file-locking mechanism in `lib/storage.ts` is suitable for small teams but not concurrent high-throughput workloads.
