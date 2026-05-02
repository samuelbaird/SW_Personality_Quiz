# Character roster and similarity engine

This document mirrors the live data and logic in [`src/lib/characterMapping.ts`](../src/lib/characterMapping.ts), [`src/lib/similarity.ts`](../src/lib/similarity.ts), and [`src/lib/questions.ts`](../src/lib/questions.ts). Trait scores are on a **0–1** scale (see [Trait reference](#trait-reference)).

---

## Trait reference

Each trait is continuous between **low** and **high** poles:

| Trait | Label | Low pole | High pole |
|------|--------|----------|-----------|
| `morality` | Morality | Dark | Light |
| `agency` | Agency | Reactive | Proactive |
| `powerOrientation` | Power Orientation | Service | Control |
| `emotionalRegulation` | Emotional Regulation | Impulsive | Controlled |
| `socialOrientation` | Social Orientation | Individual | Collective |
| `strategicThinking` | Strategic Thinking | Tactical | Long-term |
| `conviction` | Conviction | Flexible | Dogmatic |
| `riskTolerance` | Risk Tolerance | Cautious | Bold |
| `authorityOrientation` | Authority Orientation | Diplomatic | Directive |
| `authorityRigidity` | Authority Rigidity | Adaptive | Doctrinal |
| `evaluationBasis` | Evaluation Basis | Outcome-based | Process-based |
| `competenceSensitivity` | Competence Sensitivity | Loyalty / outcome | Competence-driven |
| `eloquence` | Eloquence | Simple | Articulate |
| `emotionalTone` | Emotional Tone | Cold | Warm |
| `confidence` | Confidence | Uncertain | Assertive |
| `complexity` | Complexity | Simple | Nuanced |
| `narrativeStyle` | Narrative Style | Direct | Storytelling |
| `formality` | Formality | Casual | Formal |
| `verbalDominance` | Verbal Dominance | Passive | Dominant |

Characters only store **partial** trait objects: any trait not listed for a character does **not** participate in matching for that profile.

---

## Quiz questions

User-facing copy and `primaryTraits` metadata live in [`src/lib/questions.ts`](../src/lib/questions.ts). Each session shows **`SESSION_SIZE` = 5** prompts: **three** fixed questions (always in this order), plus **two** drawn at random from the rotating pool (see `buildSessionQuestions`).

### Fixed (every session)

| `id` | Question | `primaryTraits` |
|------|----------|------------------|
| `conflict` | Describe a recent disagreement or conflict you were involved in. What was your approach, and how did it resolve? | morality, emotionalRegulation, agency, confidence, narrativeStyle |
| `power` | When working with others, how do you typically influence outcomes or decisions? | powerOrientation, authorityOrientation, authorityRigidity, socialOrientation, strategicThinking |
| `moral_ambiguity` | Have you ever justified a questionable decision because it led to a better outcome? Walk me through it. | morality, evaluationBasis, authorityRigidity, conviction |

### Rotating pool (two per session, random sample)

| `id` | Question | `primaryTraits` |
|------|----------|------------------|
| `risk` | Tell me about a time you had to make a decision without having all the information you wanted. | riskTolerance, conviction, emotionalRegulation, complexity |
| `communication` | Explain something you understand well to someone who has no background in it. | eloquence, complexity, narrativeStyle, formality |
| `longterm` | When you're working toward something important, how do you balance short-term needs with long-term goals? | strategicThinking, agency, emotionalRegulation, complexity |
| `values` | Describe a time when doing the right thing came at a personal cost. How did you handle it? | morality, conviction, emotionalTone, confidence |
| `independence` | When you're tackling a difficult problem, how do you decide whether to rely on others or handle it yourself? | socialOrientation, agency, confidence |
| `leadership` | If a team you're part of is struggling, what role do you naturally take on? | agency, powerOrientation, verbalDominance |
| `frustration` | What tends to frustrate you most, and how do you usually respond in the moment? | emotionalRegulation, emotionalTone |
| `adaptability` | Tell me about a time you changed your mind about something important. | conviction, complexity |

---

## Matching weights (`mapTraitsToCharacter`)

[`mapTraitsToCharacter`](../src/lib/characterMapping.ts) passes [`DEFAULT_WEIGHTS`](../src/lib/characterMapping.ts) into the scorer. For each trait key, if `DEFAULT_WEIGHTS` does not specify a value, the engine falls back to the defaults in [`similarity.ts`](../src/lib/similarity.ts) (`DEFAULT_TRAIT_WEIGHTS`).

**Overrides from `characterMapping.ts`:**

| Trait | Weight |
|-------|--------|
| morality | 1.5 |
| agency | 1.2 |
| emotionalRegulation | 1.1 |
| powerOrientation | 1.3 |
| strategicThinking | 1.0 |
| conviction | 1.0 |
| socialOrientation | 0.9 |
| riskTolerance | 0.9 |
| authorityOrientation | 2.0 |
| authorityRigidity | 1.8 |
| evaluationBasis | 1.8 |
| competenceSensitivity | 1.6 |
| verbalDominance | 0.8 |
| confidence | 0.7 |
| emotionalTone | 0.7 |
| eloquence | 0.6 |
| complexity | 0.6 |
| formality | 0.6 |
| narrativeStyle | 0.5 |

All other traits use `DEFAULT_TRAIT_WEIGHTS` from `similarity.ts` when not overridden above (for example `morality` defaults to **1.5** there, while `agency` and `emotionalRegulation` default to **2.0**).

---

## Character roster

Sections follow the roster layout in code: **Light / Principled**, **Independent / Gray**, **Dark / Power-Oriented**, **Contributors / Specialists**.

### Luke Skywalker (`luke_skywalker`)

*Hopeful Rebel*

| Trait | Score |
|-------|------:|
| morality | 0.95 |
| agency | 0.80 |
| emotionalRegulation | 0.50 |
| conviction | 0.70 |
| riskTolerance | 0.80 |
| emotionalTone | 0.80 |
| strategicThinking | 0.35 |
| authorityOrientation | 0.70 |
| authorityRigidity | 0.60 |
| evaluationBasis | 0.60 |
| competenceSensitivity | 0.75 |

### Obi-Wan Kenobi (`obi_wan_kenobi`)

*Measured Guardian*

| Trait | Score |
|-------|------:|
| morality | 0.95 |
| agency | 0.70 |
| emotionalRegulation | 0.90 |
| strategicThinking | 0.80 |
| formality | 0.70 |
| eloquence | 0.70 |

### Qui-Gon Jinn (`qui_gon_jinn`)

*Principled Dissenter*

| Trait | Score |
|-------|------:|
| morality | 0.95 |
| agency | 0.65 |
| emotionalRegulation | 0.90 |
| conviction | 0.90 |
| socialOrientation | 0.35 |
| authorityOrientation | 0.55 |
| authorityRigidity | 0.70 |
| evaluationBasis | 0.85 |
| emotionalTone | 0.65 |

### Yoda (`yoda`)

*Patient Sage*

| Trait | Score |
|-------|------:|
| morality | 1.00 |
| agency | 0.60 |
| emotionalRegulation | 1.00 |
| strategicThinking | 0.90 |
| complexity | 0.90 |
| narrativeStyle | 0.80 |

### Mon Mothma (`mon_mothma`)

*Principled Architect*

| Trait | Score |
|-------|------:|
| morality | 0.95 |
| agency | 0.60 |
| emotionalRegulation | 0.85 |
| socialOrientation | 0.90 |
| powerOrientation | 0.20 |
| eloquence | 0.95 |
| formality | 0.95 |
| authorityOrientation | 0.80 |
| authorityRigidity | 0.75 |
| evaluationBasis | 0.85 |
| competenceSensitivity | 0.85 |

### Leia Organa (`leia_organa`)

*Defiant Leader*

| Trait | Score |
|-------|------:|
| morality | 0.90 |
| agency | 0.95 |
| emotionalRegulation | 0.70 |
| verbalDominance | 0.80 |
| confidence | 0.90 |
| socialOrientation | 0.80 |
| authorityOrientation | 0.85 |
| authorityRigidity | 0.80 |
| evaluationBasis | 0.65 |
| competenceSensitivity | 0.80 |

### Han Solo (`han_solo`)

*Reluctant Hero*

| Trait | Score |
|-------|------:|
| morality | 0.70 |
| agency | 0.80 |
| emotionalRegulation | 0.60 |
| riskTolerance | 0.90 |
| socialOrientation | 0.30 |
| formality | 0.20 |
| confidence | 0.80 |
| authorityOrientation | 0.35 |
| authorityRigidity | 0.20 |
| evaluationBasis | 0.20 |
| competenceSensitivity | 0.40 |

### Lando Calrissian (`lando_calrissian`)

*Charming Operator*

| Trait | Score |
|-------|------:|
| morality | 0.70 |
| agency | 0.75 |
| emotionalRegulation | 0.70 |
| eloquence | 0.80 |
| confidence | 0.90 |
| socialOrientation | 0.85 |
| powerOrientation | 0.60 |
| formality | 0.60 |
| authorityOrientation | 0.50 |
| authorityRigidity | 0.50 |
| evaluationBasis | 0.55 |
| competenceSensitivity | 0.60 |

### Ahsoka Tano (`ahsoka_tano`)

*Path of Her Own*

| Trait | Score |
|-------|------:|
| morality | 0.90 |
| agency | 0.80 |
| emotionalRegulation | 0.70 |
| conviction | 0.80 |
| socialOrientation | 0.55 |
| authorityOrientation | 0.60 |
| authorityRigidity | 0.65 |
| evaluationBasis | 0.80 |
| competenceSensitivity | 0.85 |

### Din Djarin (`din_djarin`)

*Silent Protector*

| Trait | Score |
|-------|------:|
| morality | 0.80 |
| agency | 0.70 |
| emotionalRegulation | 0.90 |
| conviction | 0.90 |
| formality | 0.60 |
| emotionalTone | 0.30 |

### Cassian Andor (`cassian_andor`)

*Calculated Resister*

| Trait | Score |
|-------|------:|
| morality | 0.70 |
| agency | 0.80 |
| emotionalRegulation | 0.70 |
| strategicThinking | 0.80 |
| powerOrientation | 0.60 |
| complexity | 0.70 |
| emotionalTone | 0.40 |

### Darth Vader (`darth_vader`)

*Fallen Enforcer*

| Trait | Score |
|-------|------:|
| morality | 0.10 |
| agency | 0.85 |
| emotionalRegulation | 0.60 |
| powerOrientation | 0.90 |
| verbalDominance | 0.90 |
| emotionalTone | 0.20 |
| authorityOrientation | 0.95 |
| authorityRigidity | 0.90 |
| evaluationBasis | 0.25 |
| competenceSensitivity | 0.65 |

### Emperor Palpatine (`palpatine`)

*Master Manipulator*

| Trait | Score |
|-------|------:|
| morality | 0.00 |
| agency | 0.90 |
| emotionalRegulation | 0.90 |
| strategicThinking | 1.00 |
| powerOrientation | 1.00 |
| eloquence | 0.90 |
| complexity | 0.90 |
| authorityOrientation | 0.98 |
| authorityRigidity | 0.95 |
| evaluationBasis | 0.65 |
| competenceSensitivity | 0.85 |

### Count Dooku (`count_dooku`)

*Elegant Ideologue*

| Trait | Score |
|-------|------:|
| morality | 0.15 |
| agency | 0.85 |
| emotionalRegulation | 0.90 |
| socialOrientation | 0.70 |
| eloquence | 0.95 |
| formality | 0.95 |
| confidence | 0.90 |
| powerOrientation | 0.80 |
| authorityOrientation | 0.90 |
| authorityRigidity | 0.90 |
| evaluationBasis | 0.75 |
| competenceSensitivity | 0.80 |

### Kylo Ren (`kylo_ren`)

*Tormented Idealist*

| Trait | Score |
|-------|------:|
| morality | 0.30 |
| agency | 0.85 |
| emotionalRegulation | 0.20 |
| conviction | 0.90 |
| emotionalTone | 0.80 |
| verbalDominance | 0.70 |
| authorityOrientation | 0.75 |
| authorityRigidity | 0.60 |
| evaluationBasis | 0.40 |
| competenceSensitivity | 0.50 |

### Grand Admiral Thrawn (`thrawn`)

*Analytical Strategist*

| Trait | Score |
|-------|------:|
| morality | 0.20 |
| agency | 0.85 |
| emotionalRegulation | 0.95 |
| strategicThinking | 1.00 |
| complexity | 0.95 |
| emotionalTone | 0.20 |
| eloquence | 0.85 |
| authorityOrientation | 0.90 |
| authorityRigidity | 0.95 |
| evaluationBasis | 0.90 |
| competenceSensitivity | 0.95 |

### Moff Gideon (`moff_gideon`)

*Imperial Architect*

| Trait | Score |
|-------|------:|
| morality | 0.20 |
| agency | 0.80 |
| emotionalRegulation | 0.85 |
| powerOrientation | 0.95 |
| formality | 0.90 |
| verbalDominance | 0.85 |
| confidence | 0.90 |

### Chewbacca (`chewbacca`)

*Loyal Companion*

| Trait | Score |
|-------|------:|
| morality | 0.90 |
| agency | 0.60 |
| emotionalRegulation | 0.70 |
| socialOrientation | 0.90 |
| emotionalTone | 0.80 |
| authorityOrientation | 0.25 |
| authorityRigidity | 0.20 |
| evaluationBasis | 0.30 |
| competenceSensitivity | 0.50 |

### R2-D2 (`r2d2`)

*Resourceful Problem-Solver*

| Trait | Score |
|-------|------:|
| morality | 0.90 |
| agency | 0.80 |
| emotionalRegulation | 0.80 |
| strategicThinking | 0.70 |
| authorityOrientation | 0.30 |
| authorityRigidity | 0.30 |
| evaluationBasis | 0.50 |
| competenceSensitivity | 0.70 |

### C-3PO (`c3po`)

*Anxious Expert*

| Trait | Score |
|-------|------:|
| morality | 0.85 |
| agency | 0.30 |
| emotionalRegulation | 0.20 |
| eloquence | 0.90 |
| confidence | 0.20 |
| formality | 0.95 |
| authorityOrientation | 0.20 |
| authorityRigidity | 0.10 |
| evaluationBasis | 0.90 |
| competenceSensitivity | 0.60 |

### Boba Fett (`boba_fett`)

*Lone Operative*

| Trait | Score |
|-------|------:|
| morality | 0.40 |
| agency | 0.80 |
| emotionalRegulation | 0.90 |
| emotionalTone | 0.20 |
| socialOrientation | 0.20 |

### Fennec Shand (`fennec_shand`)

*Precision Operative*

| Trait | Score |
|-------|------:|
| morality | 0.50 |
| agency | 0.85 |
| emotionalRegulation | 0.90 |
| strategicThinking | 0.80 |
| authorityOrientation | 0.55 |
| evaluationBasis | 0.25 |
| emotionalTone | 0.25 |
| competenceSensitivity | 0.90 |

### K-2SO (`k2so`)

*Blunt Realist*

| Trait | Score |
|-------|------:|
| morality | 0.80 |
| agency | 0.80 |
| emotionalRegulation | 0.90 |
| verbalDominance | 0.80 |
| confidence | 0.95 |
| emotionalTone | 0.20 |

### BB-8 (`bb8`)

*Earnest Optimist*

| Trait | Score |
|-------|------:|
| morality | 0.95 |
| agency | 0.70 |
| emotionalRegulation | 0.60 |
| emotionalTone | 0.90 |
| socialOrientation | 0.90 |
| conviction | 0.70 |
| riskTolerance | 0.75 |
| authorityOrientation | 0.20 |

### Anakin Skywalker (`anakin_skywalker`)

*Raw Power*

| Trait | Score |
|-------|------:|
| morality | 0.50 |
| agency | 0.95 |
| emotionalRegulation | 0.20 |
| powerOrientation | 0.85 |
| riskTolerance | 0.95 |
| conviction | 0.90 |
| authorityOrientation | 0.95 |
| authorityRigidity | 0.80 |
| evaluationBasis | 0.35 |
| competenceSensitivity | 0.70 |
| emotionalTone | 0.85 |

### Padmé Amidala (`padme_amidala`)

*Duty and Heart*

| Trait | Score |
|-------|------:|
| morality | 0.95 |
| agency | 0.70 |
| emotionalRegulation | 0.85 |
| socialOrientation | 0.95 |
| authorityOrientation | 0.80 |
| evaluationBasis | 0.80 |
| competenceSensitivity | 0.85 |
| emotionalTone | 0.80 |
| eloquence | 0.90 |
| formality | 0.85 |

### Rey (`rey`)

*Emergent Guardian*

| Trait | Score |
|-------|------:|
| morality | 0.90 |
| agency | 0.85 |
| emotionalRegulation | 0.75 |
| strategicThinking | 0.65 |
| conviction | 0.80 |
| authorityOrientation | 0.70 |
| evaluationBasis | 0.75 |
| competenceSensitivity | 0.80 |
| riskTolerance | 0.75 |

### Finn (`finn`)

*Defector with Backbone*

| Trait | Score |
|-------|------:|
| morality | 0.85 |
| agency | 0.80 |
| emotionalRegulation | 0.60 |
| socialOrientation | 0.85 |
| riskTolerance | 0.85 |
| authorityOrientation | 0.40 |
| conviction | 0.65 |

---

## Similarity engine

Matching uses [`scoreCharacter`](../src/lib/similarity.ts) / [`pickBestCharacter`](../src/lib/similarity.ts) with the roster and weights above. Summary:

### Which traits count

Only traits **present on the character profile** are compared to the user. The user is expected to have a **full** `PersonalityTraits` vector (missing values are handled upstream via normalization); character targets are **partial** by design.

### Per-trait distance

User and target values are clamped to **[0, 1]**. Per trait, distance is either:

- **Squared difference:** \((u - t)^2\) (default), or  
- **Absolute difference:** \(|u - t|\)  

when `useSquaredDistance` is disabled.

Distance is multiplied by an **effective weight** for that trait (see below).

### Weights and category caps

Each trait has a base weight from the overrides + `DEFAULT_TRAIT_WEIGHTS`. Traits are grouped into scoring categories:

| Category | Traits |
|----------|--------|
| **core** | morality, agency, emotionalRegulation |
| **structural** | powerOrientation, socialOrientation, strategicThinking, conviction, riskTolerance, authorityOrientation, authorityRigidity, evaluationBasis, competenceSensitivity |
| **expression** | eloquence, emotionalTone, confidence, complexity, narrativeStyle, formality, verbalDominance |

If the **sum of weights** for traits actually present on a character exceeds a **soft cap** for that category, weights in that category are scaled down proportionally (relative priorities stay the same):

| Category | Cap |
|----------|-----|
| core | 6 |
| structural | 9 |
| expression | 4 |

### Mean weighted distance and similarity

Let \(w_i'\) be the **capped** weight for trait \(i\), \(d_i\) the distance, summed only over defined traits.

\[
\text{meanDistance} = \frac{\sum_i d_i \cdot w_i'}{\sum_i w_i'}
,\qquad
\text{similarity} = 1 - \text{meanDistance}
\]

### Coverage and final score

**Coverage** reflects how much of the global trait-weight budget the character’s profile uses (based on **raw** weights before category caps). It penalizes very sparse profiles slightly while preserving ordering:

- Constants: `COVERAGE_BASE = 0.75`, `COVERAGE_SCALE = 0.25`
- `coverageFactor = COVERAGE_BASE + COVERAGE_SCALE × coverage`

**Strong alignment bonus:** If **both** user and character exceed **0.8** on a trait, that trait adds bonus mass: `ALIGNMENT_BONUS_RATE × cappedWeight` per qualifying trait (`ALIGNMENT_BONUS_RATE = 0.20`). The bonus is normalized by `MAX_POSSIBLE_WEIGHT` from the global default weight vector.

\[
\text{finalScore} = \mathrm{clamp}_{[0,1]}\bigl(\text{similarity} \times \text{coverageFactor} + \text{normalizedBonus}\bigr)
\]

### Choosing the winner

[`pickBestCharacterDetailed`](../src/lib/similarity.ts) evaluates **every** roster entry and selects the **highest** `finalScore`. **Ties** break by **earlier position** in the roster array.

### Empty profile edge case

If a character defines **no** numeric traits, scoring returns a neutral `finalScore` of **0.5** with empty contributions.

---

## Keeping this document accurate

When you change [`CHARACTER_ROSTER`](../src/lib/characterMapping.ts), [`DEFAULT_WEIGHTS`](../src/lib/characterMapping.ts), the algorithms/constants in [`similarity.ts`](../src/lib/similarity.ts), or quiz copy / `SESSION_SIZE` in [`questions.ts`](../src/lib/questions.ts), update this file accordingly.
