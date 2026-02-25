---
track: systems
phase: 02-content-layer
plan: 03-SYS
type: execute
wave: 2
depends_on: [02-02]
files_modified: [src/lib/coursework.ts, content/coursework/cs-3780-pca.mdx]
autonomous: true
requirements: [COURSE-01]
must_haves:
  truths:
    - "Coursework data is parsed from local MDX"
    - "Supports course-specific metadata (course_code, semester)"
  artifacts:
    - path: "src/lib/coursework.ts"
      provides: "Coursework parsing logic"
---

<objective>
Implement the systems-side logic for the Coursework section, completing the core content infrastructure.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Create Coursework Utility</name>
  <action>
    Create `src/lib/coursework.ts` following the pattern of blog and projects.
  </action>
</task>

<task type="auto">
  <name>Task 2: Verify Existing Coursework Content</name>
  <action>
    Ensure `content/coursework/cs-3780-pca.mdx` has the correct frontmatter for the new utility.
  </action>
</task>

<task type="auto">
  <name>Task 3: Build Verification</name>
  <action>
    Run `npm run build` to ensure the systems logic doesn't break the static generation.
  </action>
</task>

</tasks>
