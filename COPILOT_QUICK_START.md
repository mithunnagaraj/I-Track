# GitHub Copilot Quick Start Guide
## Eye-Tracking Desktop App Project

You now have **TWO comprehensive project plans** ready for GitHub Copilot:

---

## 📋 **Plan 1: Desktop App (Windows & Mac)**
📄 **File:** `eye_tracking_desktop_app_plan.md` ⭐ **START HERE**

### What It Covers
- Web-based eye-tracking app (React + Vite)
- Electron wrapper for Windows .exe and Mac .dmg installers
- Real-time system mouse control
- 5-point calibration system
- Complete project structure
- Pre-written Copilot prompts (Section 11)

### Why This First?
✅ Fastest to MVP (3-7 weeks)  
✅ Single codebase for desktop  
✅ Easier to test locally  
✅ Foundation for mobile apps later  

---

## 📋 **Plan 2: Android App**
📄 **File:** `eye_tracking_phone_app_plan.md`

### What It Covers
- Native Android app (Kotlin)
- Eye-tracking on phone
- Gaze-based app navigation
- Finger scroll gesture detection
- Complete project structure
- Pre-written Copilot prompts (Section 10)

### Use This After
Once desktop app MVP is done, adapt patterns for Android.

---

## 🚀 **HOW TO USE WITH GITHUB COPILOT**

### **Step 1: Set Up Your Development Environment**

#### On Windows:
```bash
# Install Node.js 18+
# Download from: https://nodejs.org/

# Install Git
# Download from: https://git-scm.com/

# Install VS Code
# Download from: https://code.visualstudio.com/

# In VS Code, install:
# - GitHub Copilot extension (GitHub + $10/month or free with student)
# - Thunder Client or REST Client extension
```

#### On macOS:
```bash
# Install using Homebrew
brew install node
brew install git

# Install VS Code
# Download from: https://code.visualstudio.com/
```

### **Step 2: Create Project Repository**

```bash
# On your computer
mkdir eye-tracking-app
cd eye-tracking-app

# Initialize git
git init
git add .
git commit -m "Initial commit"

# Optional: Push to GitHub
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/eye-tracking-app.git
git push -u origin main
```

### **Step 3: Open GitHub Copilot Chat**

#### In VS Code:
1. Install **GitHub Copilot** extension
2. Sign in with your GitHub account
3. Press `Ctrl+Shift+I` (Windows) or `Cmd+Shift+I` (Mac)
4. GitHub Copilot Chat opens at the bottom

### **Step 4: Feed the Plan to Copilot**

Open `eye_tracking_desktop_app_plan.md` and use this prompt:

```
I'm building an eye-tracking desktop app using Electron + React.

Here's my complete project plan that I want you to follow:

[COPY AND PASTE THE ENTIRE MARKDOWN FILE]

Please start with Section 11, Prompt 1:
Generate the complete project structure and initial setup.
```

Add this instruction in every new chat:
```
Important execution rule:
Do not run any terminal commands yourself.
Tell me exactly which command to run, and I will run it and share the output.
Wait for my result before proceeding.
```

### **Step 5: Generate Code Module by Module**

After initial setup, follow the **Copilot Prompts** from **Section 11**:

#### Prompt 1: Project Setup (DONE) ✅
```
[Already generated above]
```

#### Prompt 2: MediaPipe Web Integration
```
Using the project plan provided above (Section 11, Prompt 2):
Implement MediaPipe Web eye-tracking for gaze estimation:

Requirements:
- Use @mediapipe/tasks-web (vision tasks)
- Detect face landmarks from webcam input
- Extract iris center coordinates
- Calculate gaze direction based on iris position
- Return normalized 0-1 coordinates for screen mapping
- Include confidence scoring (0-1)
- Handle poor lighting and face not detected

Generate these files:
- src/renderer/ml/MediaPipeWrapper.ts
- src/renderer/ml/FaceDetector.ts
- src/renderer/ml/EyeGazeEstimator.ts
- src/renderer/hooks/useGazeTracker.ts
- src/renderer/types/gaze.ts
```

#### Prompt 3: System Mouse Control
```
[Copy Prompt 3 from Section 11 of the plan]
```

**Continue this pattern for Prompts 4, 5, and 6...**

---

## 📁 **Project Structure After Generation**

```
eye-tracking-app/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts
│   │   ├── preload.ts
│   │   └── mouse/
│   │       └── MouseController.ts
│   │
│   ├── renderer/                # React app
│   │   ├── index.html
│   │   ├── App.tsx
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── ml/
│   │   └── types/
│   │
│   └── shared/
│       └── ipc-channels.ts
│
├── public/
├── electron-builder-config/     # Packaging config
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🎯 **Development Workflow**

### **Day 1: Setup (1-2 hours)**
1. Prompt 1 → Generate project structure
2. Install dependencies: `npm install`
3. Test dev server: `npm run dev`

### **Days 2-3: Eye Tracking (8-10 hours)**
1. Prompt 2 → Generate MediaPipe modules
2. Test with webcam: see gaze points appearing
3. Debug in Chrome DevTools

### **Days 4-5: Mouse Control (8-10 hours)**
1. Prompt 3 → Generate Electron mouse control
2. Connect gaze to mouse movement
3. Test actual mouse control

### **Days 6-7: Calibration (8-10 hours)**
1. Prompt 4 → Generate calibration system
2. Implement 5-point calibration UI
3. Test accuracy and adjustments

### **Days 8-10: Integration & Polish (12-15 hours)**
1. Prompt 5 → Connect all modules
2. Prompt 6 → Polish UI and settings
3. Testing on Windows and Mac

### **Days 11-12: Build & Package (4-6 hours)**
```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Both
npm run build:all
```

Output: `.exe` and `.dmg` installers in `release/` folder

---

## ✅ **What You'll Have After Each Prompt**

| Prompt | Deliverables | Time |
|--------|--------------|------|
| 1 | Full project scaffold, dependencies | 30 min |
| 2 | Eye detection + gaze calculation | 2-3 hours |
| 3 | System mouse control via IPC | 2-3 hours |
| 4 | 5-point calibration system | 2-3 hours |
| 5 | Real-time gaze-to-mouse integration | 2-3 hours |
| 6 | Settings UI + dashboard | 2-3 hours |
| **Total** | **Complete MVP** | **7-14 hours** |

---

## 🐛 **Common Issues & Solutions**

### Issue: "robot.js native binding failed"
**Solution:** Rebuild native modules
```bash
npm rebuild robot.js
```

### Issue: "MediaPipe model download fails"
**Solution:** Check internet, clear cache, retry
```bash
rm -rf node_modules/.cache
npm install
```

### Issue: "Gaze coordinates are inverted"
**Solution:** Check screen size detection in MouseController
```typescript
// Verify this returns correct values:
robot.getMousePos()  // Current mouse position
```

### Issue: "IPC communication not working"
**Solution:** Check DevTools console and main process logs
```bash
npm run dev  # Shows both renderer and main process logs
```

---

## 🔍 **Testing Your App**

### Local Testing (Dev Mode)
```bash
npm run dev
# Opens Electron window with React dev server
# Hot reload enabled (auto-refresh on code changes)
```

### Build for Distribution
```bash
# Build both Windows and macOS installers
npm run build:all

# Check release/ folder for:
# - eye-tracking-app-1.0.0.exe (Windows)
# - eye-tracking-app-1.0.0.dmg (macOS)
```

### Installation Testing
1. **Windows:** Double-click `.exe`, follow NSIS installer
2. **macOS:** Double-click `.dmg`, drag to Applications folder
3. Launch app and verify features work

---

## 📱 **After Desktop App MVP: Android Phase**

Once desktop MVP is complete:

1. Review the second plan: `eye_tracking_phone_app_plan.md`
2. Adapt calibration and gaze algorithms from web app
3. Use native Kotlin for Android-specific features
4. Reuse ML logic patterns from desktop app

---

## 🔄 **GitHub Copilot Pro Tips**

### ✅ Good Prompts:
```
"Using the GazeTracker hook, implement real-time mouse movement 
that updates at 30 FPS while applying exponential smoothing."
```

### ❌ Vague Prompts:
```
"Make the mouse move"
```

### 💡 Pro Technique:
For complex features, break into sub-prompts:

**Bad:**
```
"Generate calibration system"
```

**Good:**
```
1. "Generate CalibrationManager.ts with 5-point grid logic"
2. "Generate CalibrationPage.tsx UI component"
3. "Generate homography calculation service"
4. "Connect calibration to GazeTracker"
```

---

## 📞 **Need Help?**

If Copilot generates incomplete code:

1. **Check the error:** Read console output carefully
2. **Ask Copilot:** "Fix the [specific error] in [filename]"
3. **Reference the plan:** "According to Section 6 [algorithm], the issue is..."
4. **Show code:** Paste the problematic code and ask to fix

---

## 🎉 **Success Criteria**

Your MVP is complete when:

✅ Gaze point displays on screen  
✅ Cursor moves with gaze automatically  
✅ 5-point calibration works  
✅ Mouse clicks are accurate (±2-3% of screen)  
✅ Settings persist between app restarts  
✅ Windows .exe installer works  
✅ macOS .dmg installer works  

---

## 📊 **Estimated Timeline**

- **Setup:** 1 day
- **Development:** 6-10 days
- **Testing & Debugging:** 2-3 days
- **Polish & Documentation:** 2 days
- **Total:** **2-3 weeks** for desktop MVP

Then 2-4 more weeks for Android + iOS versions.

---

**Ready to start?**

→ Open GitHub Copilot Chat  
→ Copy `eye_tracking_desktop_app_plan.md` content  
→ Run **Prompt 1** from Section 11  
→ Follow the prompts in order  

**Good luck! 🚀**
