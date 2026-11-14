# Wavelength — Task Roadmap

## Done
- [x] QA Google Search flow end-to-end (analysis + live keyword demand render)
- [x] QA Meta flow end-to-end (analysis + audience sizing render)
- [x] Fix Meta matcher accepting unrelated interests (e.g. "Entertainment News") — now requires a shared keyword; redeployed and verified
- [x] Keyword demand switched to live DataForSEO data and verified

## Blocked
- [ ] YouTube audience check — secrets saved in Lovable (2026-11-14: client ID/secret, refresh token, customer ID). Remaining: merge + deploy the developer-token-optional change to `estimate-youtube-audience`, run a live test, and confirm Explorer access (Test access only reaches test accounts; if results come back empty, check this first)
