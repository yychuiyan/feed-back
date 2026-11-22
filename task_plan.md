# Task Plan: GitHub 静态反馈站点

## Goal
实现并验证静态反馈站点，支持需求/问题、只读处理结果和最新排序，部署 GitHub Pages。

## Next Step
下拉标题误触和反馈记录查询已实现并验证，后续按需维护真实反馈记录。

## Current Phase
Complete

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand user intent
- [x] Identify constraints
- [x] Document in findings.md
- **Status:** complete

### Phase 2: Planning & Structure
- [x] Define approach
- [x] Create project structure
- **Status:** complete

### Phase 3: Implementation
- [x] Execute the plan
- [x] Write to files before executing
- **Status:** complete

### Phase 4: Testing & Verification
- [x] Verify requirements met
- [x] Document test results
- **Status:** complete

### Phase 5: Delivery
- [x] Review outputs
- [x] Configure dedicated GitHub token and verify production submission
- [x] Deliver to user
- **Status:** complete

### Phase 6: Mobile and visitor identity
- [x] Improve narrow-screen form, upload, filters and feedback cards
- [x] Add optional remembered nickname, browser visitor UUID and visible feedback ID
- [x] Verify compatibility, browser persistence and deploy
- **Status:** complete

### Phase 7: Compact introduction and attachment preview
- [x] Replace tall introduction with one line and rename site
- [x] Add attachment previews for selected and submitted files
- [x] Add site selector below nickname and persist it in Markdown
- [x] Verify desktop/mobile locally; do not publish
- **Status:** complete

### Phase 8: Site picker with icons
- [x] Use existing app/site icons and a network glyph
- [x] Replace native select with accessible custom menu
- [x] Verify selection, keyboard and mobile locally; do not publish
- **Status:** complete

### Phase 9: Stacked site and type
- [x] Place type dropdown below site on a separate row
- [x] Add Other type and rename blog with legacy compatibility
- [x] Verify narrow screens, picker resets and persistence locally
- **Status:** complete

### Phase 10: Compact feedback IDs
- [x] Keep ID and copy action on one line with ellipsis
- [x] Show complete ID in a click bubble and verify locally
- **Status:** complete

### Phase 11: Review and publish
- [x] Review pending changes and run clean install, tests, build and Worker checks
- [x] Commit and publish frontend and submission API
- [x] Verify production submission, previews and cleanup test data
- **Status:** complete

### Phase 12: Picker labels and feedback query
- [x] Stop site and type titles from opening their dropdowns
- [x] Add feedback record query with a visible query button and clear action
- [x] Verify desktop/mobile layout, empty results and unchanged picker behavior
- **Status:** complete

### Phase 13: Automatic image compression
- [x] Resize large screenshots and photos in the browser before upload
- [x] Prefer WebP while preserving PDFs, text files, ZIPs and GIFs
- [x] Show before/after sizes and verify preview quality and mobile layout
- **Status:** complete

### Phase 14: Reliable submission route
- [x] Serve `/feedback` from the same Cloudflare domain as the static site
- [x] Remove browser dependency on `workers.dev`
- [x] Verify production submission latency and remove diagnostic records
- **Status:** complete

## Decisions Made
| Decision | Rationale |
|----------|-----------|

## Errors Encountered
| Error | Resolution |
|-------|------------|
