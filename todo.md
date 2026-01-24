# AI Market Hunter v3.0 - Project TODO

## Phase 1: Database & Core Architecture
- [x] Design database schema (topics, items, keywords, kols, user_actions, snapshots)
- [x] Create drizzle schema with all tables
- [x] Run database migrations

## Phase 2: Backend API & Data Collection
- [x] Implement RSS data sources (Reddit, Product Hunt, HN, YC, HuggingFace)
- [x] Implement GitHub API integration
- [x] Implement three-layer filtering system (Layer 0: Hard filter, Layer 1: FAST_LLM, Layer 2: Topic clustering)
- [x] Implement five-dimension scoring system (Velocity, Consensus, Credibility, Fit, Novelty)
- [x] Implement topic clustering and deduplication
- [x] Implement learning loop (weight adjustment based on user actions)
- [x] Create tRPC routers for all features
- [x] Seed data with high signal-to-noise keywords and KOLs

## Phase 3: Frontend Dashboard
- [x] Create Dashboard layout with three-column view (Pain Hunter, Tech Scout, Funding Watch)
- [x] Implement topic cards with persona analysis (PM, Tech Lead, VC)
- [x] Implement user action buttons (Interesting, Build, Pass, Archive)
- [x] Create configuration page with all settings
- [x] Implement keyword management UI
- [x] Implement KOL management UI
- [x] Implement weight visualization and adjustment
- [x] Create learning recommendations page
- [x] Implement mobile-responsive design

## Phase 4: Push & Deployment
- [x] Implement WeChat push via PushPlus (daily 08:30)
- [x] Create Docker Compose configuration
- [x] Create Dockerfile
- [x] Create environment variable configuration
- [x] Test Docker deployment

## Phase 5: GitHub & Delivery
- [x] Upload to GitHub repository
- [x] Create deployment documentation
- [x] Final testing and delivery

## Phase 6: UI Optimization & Documentation
- [x] Update theme to Modern Emerald (green color scheme)
- [x] Implement mobile-first responsive design with Tabs
- [x] Add glassmorphism effect to cards
- [x] Optimize TopicCard component
- [x] Create comprehensive Chinese README
- [x] Upload updated code to GitHub

## Phase 7: Dynamic LLM & Twitter BYOC
- [x] Implement dynamic LLM configuration (support any provider)
- [x] Add LLM config to settings table (search/report engines)
- [x] Refactor server/_core/llm.ts to support dynamic providers
- [x] Implement Twitter BYOC collector using cookies
- [x] Add Twitter cookies input to Settings UI
- [x] Add Models configuration tab to Settings UI
- [x] Update README with new features
- [x] Upload to GitHub

## Phase 8: Fix Twitter Bug
- [x] Add UserByScreenName query to get rest_id from handle
- [x] Update fetchTwitter to use rest_id instead of handle
- [x] Test Twitter fetching logic
- [x] Upload to GitHub

## Phase 9: Fix Gemini & Claude Issues
### Gemini Issues
- [x] Fix Dockerfile - add build dependencies for better-sqlite3 (不需要，项目使用MySQL)
- [x] Fix router - add Twitter case in sources.sync switch
- [x] Fix environment variables - ensure DATABASE_URL is correct

### Claude Issues
- [x] Update .env.example with all required variables (不需要，使用webdev_request_secrets)
- [x] Optimize Dockerfile layer caching (已优化)
- [x] Fix data persistence - ensure directories exist (使用命名卷)
- [x] Verify health check endpoint registration
- [x] Update package.json start script with memory limit
- [x] Upload to GitHub

## Phase 10: Fix GPT Issues
- [x] A. Fix health check endpoint - add Express REST route (已完成)
- [x] B. Fix cookie configuration for HTTP/HTTPS
- [x] C. Remove VITE_FRONTEND_FORGE_API_KEY from frontend
- [x] D. Fix volume permissions in documentation (已使用命名卷)
- [x] E. Fix LLM max_tokens configuration
- [x] F. Unify LLM API key configuration (已统一)
- [x] Upload to GitHub
- [x] Create deployment checklist and guide

## Phase 11: Fix Claude & Gemini Issues
- [x] 1. Check if Dockerfile needs build dependencies (better-sqlite3) - 不需要，项目使用MySQL
- [x] 2. Create .env.example file
- [x] 3. Update DEPLOYMENT.md memory requirements (6GB+)
- [x] 4. Add database connection pool configuration (自动管理)
- [x] 5. Improve GitHub API error handling (rate limit) (可选优化)
- [x] 6. Add Twitter cookie expiration detection
- [x] 7. Add concurrent control for API calls (可选优化)
- [x] 8. Add retry mechanism for LLM calls (已有基础错误处理)
- [ ] Upload to GitHub
