# CodeStudio Pro - Real Online Compiler, Debugger & Code Visualizer

A professional, fully functional online compiler and coding environment supporting **C, C++, Java, Python, HTML, CSS, and JavaScript**.

## Key Features & Architecture

### 1. Real Code Execution System (Section 15 & 16)
- **Judge0 API Integration**: Real compiler and execution engine for C (GCC 9.2), C++ (GCC 9.2), Java (OpenJDK 13), Python 3, and JavaScript (Node.js).
- **Execution Output Console**:
  - Standard Output (stdout)
  - Standard Error (stderr)
  - Compilation Results (with automatic tab switching on compile error)
  - Standard Input (stdin) tab allowing user-provided inputs
  - Real-time Execution Status (`Accepted`, `Time Limit Exceeded`, `Compilation Error`, etc.)
  - Execution Time (`0.042s`) and Memory Usage (`3.2 MB`)
- **Configurable Endpoints**: Choose between Public Judge0 CE (`https://ce.judge0.com`), RapidAPI Judge0, or custom self-hosted Judge0 instances. Includes intelligent safe client-side fallback if offline.

### 2. Monaco Code Editor & VS Code Developer Workspace (Section 15 & 22)
- **Monaco Editor**: Syntax highlighting, code completion, themes, minimap, line numbers, smooth scrolling.
- **Breakpoint Gutter**: Red breakpoint dots (`●`) toggled by clicking the editor margin.
- **Active Debug Line**: Line-by-line highlight decoration with step arrow.
- **VS Code Layout**:
  - **Activity Bar**: Explorer, Debug, Visualizer, Web Playground, Learning, Settings.
  - **Collapsible Sidebar**: Virtual File Explorer, Variables, Watch list, Call Stack, Breakpoints.
  - **Center Tabs**: Multi-tab buffer management, file switching, breadcrumbs.
  - **File Operations**: Create (+), Delete (🗑️), Rename (✏️), Download file, Export Project (JSON), Import Project.
  - **Keyboard Shortcuts**: `Ctrl+Enter` (Run Code), `F5` (Start/Continue Debug), `Ctrl+B` (Toggle Sidebar), `Ctrl+S` (Save).

### 3. Dedicated Debugging Environment (Section 17)
- **Breakpoints**: Click gutter or manage in the Breakpoints panel.
- **Controls**:
  - `Start / Continue` (F5)
  - `Pause`
  - `Step Over` (F10)
  - `Step Into` (F11)
  - `Step Out` (Shift+F11)
  - `Restart Debugging`
  - `Stop Debugging`
- **Variable Inspection**: Scope variables table with Name, Value, and Type.
- **Watch Expressions**: Add custom expressions (`x`, `arr[i]`, `node.val`) evaluated at each step.
- **Call Stack Trace**: Interactive call frames with function name, filename, and line numbers.

### 4. Visual Programming Experience & "Visualize My Code" (Section 18 & 19)
- **Step-by-step Trace Controls**: Play, Pause, Next Step, Previous Step, Restart, Speed Slider (0.25x to 3x).
- **C & C++**:
  - **Array Visualizer**: Contiguous memory cells with byte offsets.
  - **Pointer Visualizer**: Memory addresses (`0x7ffee3b4`), variable names, and dereferenced target arrows.
  - **Stack Memory Visualizer**: Call frames growing on the stack with local variables.
  - **Linked List Visualizer**: Nodes `[Data | Next*]` connected by pointer arrows with `head` and `tail`.
  - **Sorting Visualizer**: Animated bar chart with comparing, swapping, and sorted state colors.
- **Java**:
  - **Stack vs Heap**: JVM Stack frames with reference pointers connecting to Heap objects (`@1a2b3c`) and fields.
  - **Inheritance & Dynamic Dispatch**: Class hierarchy and runtime method dispatch resolution.
- **Python**:
  - **Recursion Tree**: Interactive branching tree of recursive function calls and return values.
  - **Data Structures**: Lists and dictionary cards with key-value mappings.

### 5. Interactive HTML, CSS, JavaScript Playground (Section 20)
- **Live Sandboxed Preview**: Isolated `iframe` with live reloading.
- **Device Switcher**: Switch between **Desktop (100%)**, **Tablet (768px)**, and **Mobile (375px)** device viewports.
- **DOM Hierarchy Visualizer**: Real-time tree view of DOM nodes, attributes, and classes.
- **Event Visualizer**: Live log of user interactions (`click`, `keydown`, `input`).
- **In-App Browser Console**: Intercepts `console.log`, `info`, `warn`, and `error`.

### 6. Interactive Learning Experience (Section 21)
- **Coding Challenges**: Curated beginner-to-intermediate challenges for C, C++, Java, Python, and JavaScript.
- **Expected vs Actual Output Comparison**: Compares program stdout against test cases with diff highlighting and PASS/FAIL badges.
- **Hints and Guided Solutions**: Instant starter code loading.

---

## How to Run

1. Open `code-studio/run.bat` or run:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\start-server.ps1
   ```
2. Navigate to `http://localhost:8080` in any web browser.
