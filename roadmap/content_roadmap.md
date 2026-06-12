# Quiz Portal — Content Roadmap

**Complexity:** ⚡ Quick Win · 🔷 Medium Effort · 🏗️ Major Project

## Tier 1 — Quiz Integrity

- [ ] 🏗️ **Answer length bias fix (245 chapters across all courses)** — The correct answer is the *longest* option in >50% of questions across virtually every course. A user can trivially game quizzes by always picking the longest option. Each chapter needs manual rebalancing: shorten correct answers, lengthen distractors, or shuffle length ranks so no single position correlates with correctness.

  Validation added in `validate-all.js` — flags any chapter where the correct answer is the unique shortest or unique longest in >50% of questions.

  Full audit report below:

  ### Book Courses

  | Course | Chapters affected | Severity |
  |--------|-------------------|----------|
  | book-algorithms-to-live-by | 7/7 (100% across 7 chapters) | 🔴 88–100% longest |
  | book-almanack-of-naval-ravikant | 10/10 | 🔴 63–100% longest |
  | book-atomic-habits | 10/11 (003.json clean) | 🔴 60–100% longest |
  | book-beginning-of-infinity | 8/8 | 🔴 75–100% longest |
  | book-bhagavad-gita | 11/11 | 🔴 71–100% longest |
  | book-cointelligence | 10/10 | 🔴 60–100% longest |
  | book-deep-work | 7/7 | 🔴 90–100% longest |
  | book-get-better-at-anything | 8/8 | 🔴 100% across all chapters |
  | book-influence | 3/8 (001, 004–006, 008 clean) | 🟡 75–88% longest |
  | book-seeking-wisdom-darwin-to-munger | 7/8 (002 clean) | 🔴 63–90% longest |
  | book-super-thinking | 10/11 (006 clean) | 🔴 56–100% longest |
  | book-the-adaptive-edge | 16/16 | 🔴 70–100% longest |
  | book-the-changing-world-order | 14/15 (004 clean) | 🔴 60–100% longest |
  | book-the-great-mental-models-v1 | 11/11 | 🔴 88–100% longest |
  | book-the-great-mental-models-v2 | 15/15 | 🔴 75–100% longest |
  | book-the-great-mental-models-v3 | 17/17 | 🔴 75–100% longest |
  | book-the-great-mental-models-v4 | 3/6 (001, 003–004 clean) | 🟡 67–100% longest |
  | book-the-psychology-of-money | 20/20 | 🔴 80–100% longest |
  | book-the-startup-of-you | 9/9 | 🔴 70–100% longest |

  ### Coursera Courses

  | Course | Chapters affected | Severity |
  |--------|-------------------|----------|
  | coursera-financial-markets-global | 7/12 | 🟡 60–80% longest |
  | coursera-finding-purpose-and-meaning-in-life | 2/6 | 🟡 63–67% longest |
  | coursera-genai-for-algorithmic-trading | 11/11 | 🔴 90–100% longest |

  ### Podcast Courses

  | Course | Chapters affected | Severity |
  |--------|-------------------|----------|
  | podcast-age-of-async-agents | 7/8 (002 clean) | 🔴 63–100% longest |
  | podcast-daytona | 5/5 | 🟡 56–100% longest |
  | podcast-nothing-ever-happens-is-over | 13/14 (003 clean) | 🔴 80–100% longest |
  | podcast-regulatory-frontier | 1/1 | 🔴 100% |
  | podcast-vibe-coding-hardware | 2/2 | 🔴 100% |
  | podcast-waste-tokens-save-time | 1/1 | 🔴 90% |

  **Totals:** 245 chapters flagged across 30 courses. No "shortest" bias detected — the systemic issue is exclusively "answer is always the longest."
