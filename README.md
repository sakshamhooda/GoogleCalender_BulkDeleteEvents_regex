# Google Calendar Bulk Delete Events (Regex Support)

A browser-based JavaScript utility to bulk delete events from Google Calendar using **regular expressions** or simple text matching.

> ✅ This project is an enhanced, modified version of the original bulk delete script by **@umeshgiri8** (downloaded and adapted to add regex support).

---

## ✨ Features

- **Regex Pattern Matching** – Use powerful regular expressions to match event titles
- **Configurable Regex Flags** – Supports `i` (case-insensitive), `g` (global), and `m` (multiline)
- **Preview Matches** – Review sample matches before confirming deletion
- **Recurring Event Support** – Handles both single and recurring events
- **Multi-Page Processing** – Automatically navigates through multiple months
- **Detailed Logging** – Comprehensive console logging for debugging
- **Error Recovery** – Graceful error handling with retry logic

---

## ✅ Usage

1. Open **Google Calendar**: https://calendar.google.com  
2. Switch to **Month View** *(recommended starting point)*
3. Open the browser **Developer Console**:
   - **Windows/Linux:** `F12` or `Ctrl + Shift + J`
   - **Mac:** `Cmd + Option + J`
4. Copy + paste the **entire script** into the console
5. Press `Enter` to run
6. Follow the prompts:
   - Enter number of months to process
   - Enter your regex pattern
   - Enter regex flags *(default: `i`)*
   - Review sample matches and confirm deletion

---

## 🧠 Regex Examples

| Pattern | Description |
|--------|-------------|
| `Meeting` | Matches any event containing **"Meeting"** |
| `Meeting\|Sync\|1:1` | Matches **Meeting**, **Sync**, OR **1:1** |
| `^Daily` | Matches events starting with **"Daily"** |
| `Meeting.*2024` | Matches **"Meeting"** followed by anything, then **"2024"** |
| `\[Cancelled\]` | Matches literal **"[Cancelled]"** *(brackets escaped)* |
| `Team\s+Meeting` | Matches **"Team" + whitespace + "Meeting"** |
| `standup` *(with `i` flag)* | Case-insensitive match: standup / Standup / STANDUP |

---

## ⚙️ Configuration (Advanced Mode)

The script supports an **Advanced Mode** for customizing UI labels (useful for non-English locales):

```js
const ADVANCED_MODE = true; // Set to true to customize labels
```

  When enabled, you can customize:
  
  - Next page button label (default: "Next month")
  - Delete event button label (default: "Delete event")
  - Delete task button label (default: "Delete task")
  - Recurring event dialog labels

✅ Requirements

  - Modern chromium based web browser 
  - Access to Google Calendar
  - JavaScript enabled

⚠️ Safety Notes

- This action **cannot be undone** — deleted events are permanently removed

- Always review the sample matches before confirming

- Start small (e.g., 1 month) to test your regex pattern safely

- Check the console logs for details if something goes wrong

- Immediately close the browser if you see deletions going unexpected / unintended way

## 🙌 Credits

This project is an enhanced adaptation of the original **Google Calendar Bulk Delete** script by **[@umeshgiri8](https://github.com/umeshgiri8)**.

🔗 Original Repository:  
https://github.com/umeshgiri8/google-calendar-bulk-delete

---

## 🔍 Differences From the Original

| Feature | Original | This Version |
|--------|----------|--------------|
| Search Method | Simple text matching (contains) | ✅ Full regex support |
| Matching Logic | XPath `contains()` | JavaScript `RegExp.test()` |
| Case Sensitivity | Case-sensitive only | ✅ Configurable via flags |
| Pattern Flexibility | Exact substring match | ✅ Wildcards, alternation, anchors, classes |
| Match Preview | ❌ No | ✅ Yes |
| Regex Validation | ❌ No | ✅ Yes |
| Error Messages | Basic | ✅ Regex-aware + detailed |

---

## ✅ When to Use Which

### ✅ Original Script
Use it when you want to delete events by a **known exact substring**.

### ✅ This Version
Use it when you need:
- ✅ Pattern matching
- ✅ Case-insensitive matching
- ✅ Complex filtering rules
- ✅ Preview before deletion

---

## 📄 License
**MIT License** — free to use, modify, and distribute.

---

## 🤝 Contributing
Pull requests are welcome!  
For major changes, please open an issue to discuss proposals first.
