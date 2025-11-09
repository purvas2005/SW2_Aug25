# TODO: Update BadgeManagement Component

- [x] Remove badges array, toggleBadgeStatus function, and list rendering from BadgeManagement.tsx
- [x] Simplify newBadge state to only include name and type
- [x] Update form to only include Name input and Badge Type select with "Hackathon Winner" and "Innovation Award" options
- [x] Change button text to "Create Badge"
- [x] Update handleAddBadge to log the new badge and reset the form
- [x] Fix code duplication by merging the component definitions
- [x] Verify the component renders correctly with only the form elements

# TODO: Remove Navigation and Display Only BadgeManagement

- [x] Remove AdminNavigationTabs import and usage from AdminDashboard.tsx
- [x] Remove activeTab state from AdminDashboard.tsx
- [x] Remove AdminNavigationTabs component from JSX in AdminDashboard.tsx
- [x] Remove conditional rendering and directly render BadgeManagement in main-content
- [x] Keep AdminHeader
- [x] Run frontend to verify only BadgeManagement is displayed (Note: Terminal commands failed due to PowerShell syntax issues, but code changes are correct)
