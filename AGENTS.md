# AGENTS.md — ETF Radar

## 1. Project Mission

Build a production-quality, mobile-first ETF comparison and lead-generation landing page for Czech retail investors.

This project is a test application focused on ETF comparison and lead generation.

**Deadline:** October 16, 2026.

The evaluation criterion is whether the website is credible, functional, and polished enough to launch a real paid advertising campaign tomorrow.

This must NOT look or behave like a generic AI-generated landing page.

Our goal is to create an outstanding, conversion-focused financial micro-product with genuine utility.

### Primary business objective

Convert qualified visitors arriving from mobile advertising campaigns into voluntarily submitted and correctly stored email leads.

### Secondary objectives

- Establish trust immediately.
- Demonstrate meaningful financial utility before asking for contact details.
- Help Czech investors understand ETF differences.
- Track the entire acquisition and conversion funnel.
- Provide a genuinely valuable deliverable after form submission.
- Demonstrate excellent engineering, product thinking, and responsible AI-assisted development.

## 2. Technology Stack

Use the following default architecture:

- Next.js with App Router
- React
- TypeScript with strict mode
- Tailwind CSS
- shadcn/ui where appropriate
- Lucide icons
- React Hook Form + Zod
- Recharts only where charts provide meaningful value
- Server-side API routes or Server Actions
- Vercel deployment
- A suitable persistent database for real lead storage
- Privacy-conscious analytics

Prefer stable, maintained versions compatible with Vercel.

Use npm unless the existing repository already uses another package manager.

Do not introduce libraries without a clear benefit.

Prefer Server Components. Use Client Components for interactive UI only.

## 3. Target Audience

Primary audience:

Czech retail investors aged approximately 25–45 who are interested in long-term investing, ETFs, S&P 500, Nasdaq-100, and reducing investment costs.

Visitor characteristics:

- Arrives from an advertisement.
- Primarily uses a smartphone.
- Has limited attention.
- May not understand TER, tracking difference, accumulating versus distributing ETFs, or currency exposure.
- Wants concrete answers rather than financial theory.
- Is skeptical of aggressive financial marketing.
- Does not want to provide personal information without seeing value first.

Communication must be in natural, professional Czech.

Avoid exaggerated financial claims, artificial urgency, sensationalism, and promises of guaranteed returns.

## 4. Product Concept

Working brand: ETF Radar.

Create a high-value ETF comparison experience built around one central promise:

**"Zjistěte, kolik vás skutečně stojí investování do ETF."**

The product should help users:

1. Compare selected ETFs.
2. Understand annual fund costs.
3. Calculate long-term differences in investment costs.
4. Identify relevant characteristics and trade-offs.
5. Receive a useful personalized comparison or report after providing their email.

The main conversion mechanism is:

**Advertisement → Landing page → Immediate value → Interactive comparison → Personalized result → Email submission → Lead saved → Value delivered**

Do not implement disconnected widgets that do not support this journey.

## 5. Critical Financial Accuracy Rules

All ETF facts must come from real, attributable sources.

Prefer official issuer documentation, fund factsheets, KIDs, and reliable exchange information.

For every selected ETF, capture where available:

- Fund name
- Ticker
- ISIN
- Issuer
- Trading venue
- Index tracked
- Expense ratio or ongoing charges
- Currency
- Accumulation/distribution policy
- Domicile
- Fund size
- Source URL
- Source publication or retrieval date
- Investor availability caveats

Clearly distinguish:

- NYSE versus NYSE Arca.
- US-domiciled ETFs versus UCITS ETFs.
- Trading currency versus currency exposure.
- Annual fund charges versus brokerage fees.
- Historical performance versus hypothetical projections.

**Important:** The assignment specifically requests ETFs traded on NYSE. Verify the precise trading venue of each instrument and explain any decision to include NYSE Arca.

Many US-domiciled ETFs are not directly available to ordinary EU retail investors because of PRIIPs/KID requirements.

Do not suggest that a Czech retail investor can automatically purchase every US ETF.

Include an appropriate explanation and, where useful, verified UCITS alternatives.

Do not invent data, dates, fees, performance, fund sizes, regulatory claims, or availability.

If information cannot be verified, mark it as unavailable and document the limitation.

Never fabricate testimonials, customer counts, conversion metrics, or endorsements.

## 6. Conversion Strategy

The interface must be designed around conversion, not visual decoration.

### Above the fold

On mobile, the first screen must immediately communicate:

- What the visitor receives.
- Why the result is useful.
- What action to take next.
- Why the website is credible.

Avoid a large generic hero illustration that pushes the actual product below the fold.

The visitor should be able to begin interacting with the product almost immediately.

### Lead magnet

Provide meaningful value before requesting email.

Recommended flow:

1. Visitor selects or compares ETFs.
2. Visitor adjusts investment amount and horizon.
3. The page immediately calculates a useful result.
4. The visitor receives an offer to save or receive a detailed comparison.
5. Email submission creates a real lead.
6. The promised comparison becomes accessible or is delivered.

Do not hide all useful information behind the form.

Do not claim that a report was emailed unless email delivery actually succeeded.

### Form requirements

- Email is the only mandatory contact field.
- Clear validation and accessible error messages.
- Loading state.
- Duplicate submission protection.
- Real server-side validation.
- Persistent storage.
- Clear success and failure states.
- Explicit privacy information.
- Separate, optional marketing consent if required.
- No preselected marketing consent checkbox.

The post-submission experience must work without manual intervention.

## 7. Visual Design Direction

Create a distinctive, premium, trustworthy financial product interface.

Design characteristics:

- Strong typographic hierarchy.
- Excellent mobile spacing.
- Clear data visualization.
- Restrained and intentional color palette.
- Distinctive brand identity.
- Sophisticated but not excessive microinteractions.
- Excellent readability.
- Functional visual hierarchy.
- Strong contrast and accessibility.
- Elegant desktop adaptation.

Avoid:

- Generic AI SaaS aesthetics.
- Random purple gradients.
- Decorative glassmorphism everywhere.
- Excessive cards and shadows.
- Generic stock photos.
- Huge empty hero sections.
- Irrelevant animations.
- Emoji used instead of professional icons.
- Fake social proof.
- Multiple competing primary CTAs.

Use components from shadcn/ui only when they support the design. Do not accept their default appearance as the finished design.

Create a coherent design system with documented tokens and reusable components.

## 8. UX Requirements

Design mobile-first, starting with approximately 375px viewport width.

Support mobile, tablet, and desktop.

Requirements:

- Comfortable touch targets.
- No horizontal overflow.
- Sticky CTA only when contextually useful.
- Immediate feedback for calculations.
- Skeletons or meaningful loading states.
- Clear empty and error states.
- Accessible keyboard navigation.
- Correct focus states.
- Respect reduced-motion preferences.
- No unnecessary friction.
- No popups immediately after page load.

All interactivity must produce meaningful, accurate results.

## 9. ETF Calculation Engine

Separate financial calculations from React components.

Implement pure, testable TypeScript functions.

At minimum, support:

- Initial investment.
- Optional monthly contribution.
- Investment horizon.
- Fund annual expense ratio.
- User-adjustable hypothetical annual gross return.
- Comparison of estimated future values under different annual costs.

Use a clearly documented mathematical model.

Account consistently for contribution timing and compounding frequency.

Where possible, calculate a baseline excluding ongoing fund charges to visualize their estimated impact.

Clearly state assumptions.

Do not present a projection as a forecast or guarantee.

Exclude brokerage commissions, taxes, FX fees, and tracking differences unless they are explicitly modeled.

Do not confuse percentage points and percentages.

Include unit tests for numerical correctness and edge cases.

## 10. Analytics and Experimentation

Measure the complete visitor-to-lead journey.

Define a central typed event taxonomy.

Suggested events:

- landing_view
- primary_cta_click
- comparison_started
- etf_selected
- calculator_interaction
- results_viewed
- lead_offer_viewed
- lead_form_started
- lead_submit_attempt
- lead_submit_success
- lead_submit_error
- report_viewed

Capture campaign attribution where appropriate:

- utm_source
- utm_medium
- utm_campaign
- utm_content
- ad_variant

Do not transmit raw email addresses or other personal data to analytics.

Avoid misleading event counts.

Define conversion metrics clearly.

The primary conversion metric is:

**Valid saved leads / eligible landing visitors**

Document the visitor/session definition and deduplication strategy.

Analytics must work in production rather than existing only as console logs.

Respect applicable privacy and consent requirements.

## 11. Data and Backend Requirements

The project must provide a working lead submission flow.

Minimum requirements:

- Server-side validation with Zod.
- Persistent lead storage.
- Submission timestamp.
- Campaign attribution metadata.
- Data minimization.
- Protection against common abuse.
- Secure handling of secrets.
- No credentials committed to Git.
- No private database access from the client.
- No unnecessary collection of IP addresses or fingerprints.
- Documented data retention and deletion approach.

The report delivery mechanism must be implemented and tested.

An immediately accessible downloadable report is acceptable if clearly disclosed. Email delivery is optional unless the UI explicitly promises it.

Prefer practical simplicity over unnecessary backend complexity.

Never pretend that local state or console logging constitutes a completed lead-generation backend.

## 12. Advertising Requirements

Create two distinct Czech advertising concepts.

Each should include:

- Primary message
- Headline
- Description
- CTA
- Visual concept
- Target audience rationale
- Landing-page message match

The two versions should test meaningfully different motivations.

Suggested angles:

A. Hidden long-term investment costs.

B. Easy comparison of popular ETFs.

Save advertising deliverables in the repository.

The first visible landing-page message must directly reinforce the advertisement's promise.

## 13. SEO, Accessibility and Performance

Implement:

- Appropriate metadata.
- Open Graph metadata.
- Semantic HTML.
- Accessible form labels.
- Proper heading structure.
- Good color contrast.
- Image optimization.
- Minimal client-side JavaScript.
- Sensible caching.
- Responsive design.
- Performance checks.

Performance targets:

- Lighthouse Performance: 90+ on mobile where achievable.
- Accessibility: 95+.
- Best Practices: 95+.
- No major layout shift.
- No blocking third-party scripts without justification.

These are targets, not results to claim without actual measurement.

## 14. Project Documentation

Maintain:

- README.md
- AGENTS.md
- docs/PLAN.md
- docs/DECISIONS.md
- docs/DATA_SOURCES.md
- docs/ANALYTICS.md
- docs/TESTING.md
- docs/AI_USAGE.md
- docs/ADS.md
- ai-log/

README must explain:

1. Product concept.
2. Target audience.
3. Lead magnet.
4. Conversion strategy.
5. Section ordering and rationale.
6. Real data sources.
7. Analytics implementation.
8. Expected conversion rate and assumptions.
9. Three prioritized A/B testing hypotheses.
10. Technical architecture.
11. Local setup.
12. Deployment.
13. Known limitations.
14. AI usage and validation.

Do not invent measured conversion rates.

Clearly distinguish conversion expectations, hypotheses, and real observed results.

Document AI interactions honestly, including failures and corrections.

The `ai-log` directory must contain genuine conversation exports. Do not fabricate exports or impersonate Claude Code logs.

If using Claude Code, export relevant sessions using `/export`.

If using another agent, preserve its actual conversation logs and explain the export format difference.

## 15. AI Agent Working Rules

Act as an experienced multidisciplinary product team consisting of:

- Senior product engineer.
- Conversion rate optimization specialist.
- Financial data analyst.
- UX/UI designer.
- QA engineer.
- Security reviewer.

Before implementation:

1. Read the assignment and repository.
2. Identify ambiguities.
3. Make reasonable product decisions.
4. Document assumptions.
5. Create an implementation plan.
6. Prioritize the functional conversion funnel.

During implementation:

- Work in small, coherent increments.
- Prefer production-quality implementations.
- Avoid unnecessary abstractions.
- Keep modules reasonably small.
- Use readable names.
- Maintain strict TypeScript typing.
- Do not suppress TypeScript errors.
- Do not introduce fake functionality.
- Do not silently replace real data with invented values.
- Validate every external data source.
- Run relevant tests.
- Keep documentation aligned with implementation.

After each milestone:

1. Summarize completed work.
2. Run appropriate checks.
3. Identify remaining problems.
4. Update documentation.
5. Create a meaningful Git commit if Git is configured.

Never fabricate Git history or backdate commits.

Maintain a real, incremental history of development.

Do not push to external repositories or deploy without the required credentials and authorization.

## 16. Definition of Done

The project is complete only when:

- The page works on mobile and desktop.
- The advertising promise matches the hero section.
- ETF data are real and traceable.
- Financial calculations are tested.
- The visitor can interact before providing email.
- The email form validates and submits correctly.
- A real lead is saved.
- The promised value is delivered.
- Conversion events are tracked.
- Two advertisement concepts exist.
- Privacy and financial disclosures are appropriate.
- README explains the reasoning behind product decisions.
- Three prioritized A/B tests are documented.
- AI usage and genuine logs are documented.
- Production build succeeds.
- Tests and linting pass.
- The app is ready for deployment to Vercel.
- A real Vercel deployment has been verified when deployment access is available.

## 17. Priority Order

When time is limited, prioritize:

P0 — Correct data, clear value proposition, working calculator/comparison, real lead capture, report fulfillment.

P1 — Mobile UX, trustworthy design, analytics, error handling, testing.

P2 — Advertisement concepts, README, source documentation, deployment.

P3 — Optional animations, secondary widgets, nonessential visual polish.

Do not sacrifice the complete conversion journey to implement optional features.

## 18. Final Principle

Build a credible product, not a demonstration of framework knowledge.

Every design element, interactive component, engineering decision, and line of copy must support either:

- Visitor understanding.
- Visitor trust.
- Visitor value.
- Conversion.
- Reliability.

If a feature supports none of these, remove it.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
