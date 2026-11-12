---
name: lemo-film-director
description: "Direct, write treatments, storyboard, score, and oversee code-driven films in Lemo-Opuscar. Triggers on: film director, film treatment, write treatment, storyboard, score film, direct animation, visual pacing, audio mix film, film grammar."
user-invocable: true
---

# Lemo Film Director: Directing Method & Treatment Workflow

Specialized directing and production workflow for code-driven films, motion graphics, and animated shorts based on the Lemo-Opuscar Directing Handbook (`DIRECTOR.md`).

A film is judged in this order of precedence: **sound, rhythm, camera, directing** (performance, staging, emotional arc). Good-looking frames are only the starting point.

---

## 1. The Brief & Invariants

Defaults when taking a user request:
- **Duration:** 30–60 seconds (tight beats, high density; >2 minutes multiplies compute & rendering time).
- **Resolution & Frame Rate:** 1920×1080 at 24 fps default (or 30/60 fps if specified in the style's `STYLE.md`; vertical 1080×1920 with `--size 1080x1920`).
- **Target Loudness:** -14 LUFS (EBU R128 standard).
- **Language:** Subtitles burned in and exported as `.srt`. Voice-over matching user preference.

Ask the user **once** in a single message for:
1. Necessary facts, mandatory brand marks or logos.
2. User-provided audio (voice tracks, music), fonts, or imagery.
3. Language preference (Chinese or English default).
4. Review preference (whether they want to review a storyboard first).

---

## 2. Story Shaping Rules

- **One subject, one goal, one turn:** A character, product, or idea wants something, encounters change, and resolves differently from where it started.
- **Hook in the first 3 seconds:** Immediate visual or auditory engagement; avoid prolonged slow title cards.
- **An ending that echoes:** Bookend the opening shot, reveal true scale, or show the subject succeeding on a second attempt.
- **One native move:** A visual technique unique to the medium (e.g., ink blooming across frames, isometric layer folding, blueprint type grid snapping to final mark). Place it at the emotional climax.
- **Simplicity over clutter:** One gag or focal point read clearly at thumbnail scale beats three complex elements.

---

## 3. Writing the Treatment (`TREATMENT.md`)

Write `TREATMENT.md` in the project directory **before** inspecting demo code:

```markdown
# Treatment: [Film Title]
Style: [Style Slug]
Target Duration: [e.g. 45s]
Format: 1920x1080 @ 24fps

## 1. Candidate Structures
- Option A: Single continuous journey.
- Option B: Problem vs Solution split.
- Option C: Countdown / Escalation.
Selected: [Chosen structure and artistic rationale]

## 2. Logline & Narrative Arc
- Logline: [One sentence premise]
- Setup (0-15s) -> Turn (15-30s) -> Climax & Ending (30-45s)

## 3. Benchmarks
- References: [Films, games, title sequences]
- What to learn: [Pacing, camera grammar, palette]
- What to avoid: [Direct copying of character designs, proprietary logos]

## 4. Shot List
| Shot # | Timecode | Framing | Angle | Camera Move | Description & Intent |
|---|---|---|---|---|---|
| 01 | 00:00 - 00:05 | Wide | Low | Slow push-in | Establish setting & hook |

## 5. Beat Sheet (Second-by-Second)

## 6. Audio Cue Map & Rhythm
- Tempo: [BPM], Time Signature: [4/4]
- Key cuts and transitions land on downbeats.

## 7. Sound Design Table
| Section | Ambience Bed | Foley & SFX | Music Layer |
|---|---|---|---|
| Intro | Room tone / wind | Footstep click | Soft pad chord |

## 8. Subtitles & Typography
- Font: [Font family], Style: [Uppercase/Tracking], Screen Placement
```

---

## 4. Look Verification (Style Frames)

Before full animation:
- **With characters:** Render a model sheet (turnaround, 3-4 expressions, key poses) + 2 style frames using real canvas/webgl drawing code.
- **Without characters:** Render 3 style frames including the signature climax shot.
- Verify color contrast, typography readability, and medium texture against `STYLE.md`.

---

## 5. Audio & Voice Pipeline

1. **Voice (`core/tts/`):**
   - Offline English/Chinese: Kokoro TTS (`python core/tts/tts.py`).
   - High-fidelity Online Chinese: Edge TTS (`python core/tts/tts_zh.py`).
2. **ASR Quality Check (`core/tts/asr_check.py`):**
   - Transcribe generated voice back to text; ensure word alignment and zero dropped syllables.
3. **Score & SFX:**
   - Synthesize plucked strings, percussion, or pads (`core/audio/pluck.py`, `core/audio/sfx.py`).
   - Audio normalization to -14 LUFS via FFmpeg loudnorm filter.

---

## 6. Rendering & Delivery Checklist

Run the review loop:
- [ ] No blank, black, or NaN frames in render sequence.
- [ ] Contact sheet rendered and inspected (`python core/render/sheet.py`).
- [ ] Loudness verified at -14 LUFS.
- [ ] Subtitles synchronized without obscuring focal action.
- [ ] Map compliance: Accurate boundary representations when geographic maps are shown.
- [ ] Deliverables in project directory:
  - `<name>.mp4`
  - `poster.jpg`
  - `<name>.srt`
  - `TREATMENT.md`
  - `CREDITS` (Licensing for all fonts, audio samples, assets)
  - `build.sh` (Deterministic build script)
