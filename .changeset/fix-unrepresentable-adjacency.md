---
"rosetta-date": minor
---

Fix unrepresentable token adjacency to degrade honestly. When a target grammar
cannot separate two adjacent tokens that would re-merge into a different token
(for example two numeric quarters rendered into `ldml`, which has no zero-width
separator), the second token now routes to the `onUnsupportedToken` policy like
every other unrenderable token — literalized by default, or thrown/handled per the
policy. Previously it was emitted verbatim, producing a silently wrong merged
token (`Q` + `Q` read back as a 2-digit quarter).
