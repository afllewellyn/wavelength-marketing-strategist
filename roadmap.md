# Wavelength — Task Roadmap

## Done
- [x] QA Google Search flow end-to-end (analysis + live keyword demand render)
- [x] QA Meta flow end-to-end (analysis + audience sizing render)
- [x] Fix Meta matcher accepting unrelated interests (e.g. "Entertainment News") — now requires a shared keyword; redeployed and verified
- [x] Keyword demand switched to live DataForSEO data and verified

## Blocked
- [ ] YouTube audience check — code updated for the post-developer-token flow (dev token and login-customer-id now optional). Waiting on four secrets: `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID` (OAuth required; API keys are rejected). Also pending: Explorer access application (Test access reaches test accounts only). Redeploy `estimate-youtube-audience`, then re-test.
