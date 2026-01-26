# Feature Testing Guide

## New Features to Test

### 1. Task Priority Colors ✅

**How to test:**

1. Open the app at http://localhost:8081
2. Sign in if needed
3. Add 3 tasks
4. Observe the colored bars on the left edge of each task:
   - Task 1: Red bar (highest priority)
   - Task 2: Yellow/Orange bar (medium priority)
   - Task 3: Green bar (lowest priority)

**Expected Result:** Each task has a different colored vertical bar indicating priority

---

### 2. Estimated Pomodoros & Subtasks ✅

**How to test:**

1. Click the **pencil icon** (edit) on any task
2. A modal should appear with:
   - Current task title at top
   - "Estimated Pomodoros" field with timer icon
   - "Subtasks (0/3)" section with add functionality

**Test Estimated Pomodoros:**

- Enter a number like "3" in the pomodoros field
- Click "Save Changes"
- Task card should now show a badge: "3 🍅"

**Test Subtasks:**

- Click edit again
- Add a subtask title (e.g., "Research API")
- Click the + button
- Add 2 more subtasks (max is 3)
- Click "Save Changes"
- Task card should show: "2/3 subtasks" badge
- Click the badge to expand/collapse subtasks
- Check/uncheck subtasks to mark them complete

**Expected Result:**

- Pomodoro estimate appears as badge
- Subtasks can be added (max 3)
- Subtasks can be toggled complete/incomplete
- Subtask progress shows X/Y format

---

### 3. Session History Calendar ✅

**How to test:**

1. Go to **Settings** tab
2. Scroll to "SESSION HISTORY" section
3. Click the **chevron down** icon to expand

**What to check:**

- Calendar shows current month
- Use **<** and **>** arrows to navigate months
- Days with completed pomodoros have:
  - Highlighted background (pinkish)
  - Small number badge showing session count
- Top stats show:
  - Total sessions for the month
  - Total time spent
- Bottom shows preset breakdown if sessions exist

**To generate test data (optional):**

1. Complete a pomodoro session first (see Pomodoro test below)
2. Come back to settings to see it in the calendar

**Expected Result:** Calendar view with session activity visualization

---

### 4. CSV Export ✅

**How to test:**

1. Go to **Settings** tab
2. Scroll to "DATA MANAGEMENT" section
3. Click "Export Analytics to CSV" button

**Expected Result:**

- On Web: CSV file downloads automatically
- CSV contains:
  - Overall statistics
  - Pomodoro breakdown by preset
  - Session history with dates and details
- Check your Downloads folder for file named like `focusshield-analytics-2026-01-10.csv`

---

### 5. Theme System ✅

**How to test:**

1. Go to **Settings** tab
2. Scroll to "APPEARANCE" section
3. Two options should be visible:
   - **Dark Mode** (moon icon) - currently selected
   - **Light Mode** (sun icon)

**Test:**

- Click "Light Mode"
- Click "Save Settings" button
- Note the alert message mentions reloading
- Reload the page (F5 or browser reload)

**Expected Result:** Theme setting is saved (Light mode implementation is UI only - full theme would require updating all component styles)

---

### 6. Complete Feature Integration Test

**Full workflow test:**

1. **Add a task with details:**
   - Create task: "Build new feature"
   - Edit it → Set 5 pomodoros estimated
   - Add subtasks: "Design", "Code", "Test"
   - Save changes

2. **Start a focus session:**
   - Click the timer FAB button (bottom right)
   - Select "Classic Pomodoro" (you'll see estimated pomodoros if task is selected)
   - Link it to your task
   - Start the session

3. **During the session:**
   - Scroll down in timer modal to see:
     - Ambient sound controls (Rain, Waves, Forest, etc.)
     - Your music links (if you added any)
   - Try toggling an ambient sound and adjusting volume
   - Try opening a music link

4. **Complete the session:**
   - Wait for it to complete OR click "End Session"
   - Check that task shows progress

5. **Verify tracking:**
   - Go to Settings
   - Check analytics dashboard for updated stats
   - Check streak (should be 1 if first session today)
   - Expand session history calendar
   - Today should be highlighted with "1" badge

6. **Export data:**
   - Click "Export Analytics to CSV"
   - Open the CSV file
   - Verify your session appears in the history

---

## Known Issues/Notes

- **Theme**: Light mode selector works but full theme implementation requires updating all component styles
- **Favicon errors**: These are harmless - just SVG format warnings
- **Ambient sounds**: Uses placeholder URLs - you may want to replace with actual audio files
- **Music links**: Add Spotify/YouTube links in Settings → Focus Music section

---

## Test Checklist

- [ ] Priority colors show on tasks (Red/Yellow/Green)
- [ ] Can add estimated pomodoros to task
- [ ] Can add/remove subtasks (max 3)
- [ ] Can toggle subtasks complete/incomplete
- [ ] Session history calendar shows completed sessions
- [ ] Can navigate calendar months
- [ ] CSV export downloads with correct data
- [ ] Theme selector appears in settings
- [ ] Theme preference saves
- [ ] All features work together in workflow

---

**App URL:** http://localhost:8081
**Dev Server:** Should be running in background (check with `ps aux | grep expo`)
