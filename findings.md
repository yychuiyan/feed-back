# Task Plan: GitHub 静态反馈站点

## Goal
实现并验证静态反馈站点，支持需求/问题、只读处理结果和最新排序，部署 GitHub Pages。

## Next Step
本地实现站点/类型两列下拉、新增其他、博客更名并验证；不发布。

## Current Phase
Phase 9

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

### Phase 9: Two-column site and type
- [ ] Place site and type dropdowns in one row
- [ ] Add Other type and rename blog with legacy compatibility
- [ ] Verify narrow screens, picker resets and persistence locally
- **Status:** in_progress

## Decisions Made
| Decision | Rationale |
|----------|-----------|

## Errors Encountered
| Error | Resolution |
|-------|------------|

- 用户最新修正：站点与类型改为上下两行，类型在站点下方；保留类型下拉、其他选项及炊烟小站命名。

- 用户要求反馈卡片底部编号省略显示，点击气泡查看完整编号，与复制按钮保持一行。气泡支持再次点击、外部点击、Esc和焦点移出关闭。保持未发布。
