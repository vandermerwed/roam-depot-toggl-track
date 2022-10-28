# Toggl Track Roam Extension

This extension allows you to track time in Toggl Track and pull timers into your Roam Research database.

![roam_depot_toggl_track_demo](https://user-images.githubusercontent.com/8472841/198710388-3c10e611-7037-4eae-b417-50298115d239.gif)

> 🚧 This extention is still work in progress and there might be breaking changes from time to time. Please [report any issues](https://github.com/vandermerwed/roam-depot-toggl-track/issues) you find.

## Configuration

1. **API Token** - Go to your [Toggl Track profile](https://track.toggl.com/profile) and copy your API token at the bottom of the page.
2. **Workspace ID** - The extension will attempt to automatically set your default Workspace after you copy in your API Token but the value won't be visible until you close and open the settings window. *Alternatively, Go to your [Toggl Track reports](https://track.toggl.com/reports/summary) and copy the number in the URL. This is your workspace ID.*
3. **Running Timer Template** - The template to use when writing timer entries into Roam.

## Template Usage

The **Running Timer Template** is the only supported template in the current release. The template is a string that will be parsed and written into Roam. The following placeholder variables are supported:

---

| Placeholder      | Replacement Value
| ---------------- | -----------------
| `{entry_id}`     | `\|\|1234567890\|\|` - The Toggl Track entry ID. It's recommended that this always added somewhere in the template. This will be used in the future to identify and update existing entries.
| `{start_time}`   | Start time in 24h format: `13:42`
| `{description}`  | The timer description
| `{duration}`     | **Not implemented yet** - The duration of the timer in hours, minutes and seconds: `01:42:24`
| `{project}`      | The project name
| `{client}`       | The client name
| `\n`             | Equivelent to `Shift + Enter`. Breaks to a new line in the block.

---

Here are some examples of how you can use the template:

```
[🕒](||{ENTRY_ID}||) [{START_TIME}] {DESCRIPTION}\n#[[{PROJECT}]] #[[{CLIENT}]]
```

```
[⌛](||{ENTRY_ID}||) [{START_TIME}] #[[{PROJECT}]] #[[{CLIENT}]]\n{DESCRIPTION}
```

```
[{START_TIME}](||{ENTRY_ID}||) - {DESCRIPTION} #[[{PROJECT}]] #[[{CLIENT}]]
```

> Some more time related emoji ideas:
⏱🕒🕛⏰⌚⌛⏳⏲🕰️

Feel free to tweet your creative template ideas to [@vandermerwed](https://twitter.com/vandermerwed)!

## Usage

This extension adds two new commands to the command palette (`Ctrl + P` / `⌘ + P`):
1. **Toggl: Start Timer** - Starts a new timer in Toggl Track and writes the entry into Roam.
2. **Toggl: Get Current Running Timer** - Gets the current running timer from Toggl Track and writes the entry into Roam.

## Future development - in no particular order

- More commands
  - Stop timer
  - Get all timers for today
  - Get all timers for specific day
  - Get all timers for date range
  - Get total tracked time for today
  - etc.
- Pomodoro workflows
- Different templates for running and completed entries
- Sync entry with Toggl
    - one-way (Roam -> Toggl)
    - two-way (Roam <-> Toggl)
- SmartBlock integration to start/stop timers from SmartBlock routines
- Expose select endpoints as a library on window object so other extensions can use it as well
    - Document this (how to check if it is loaded, configured, etc.)
- Reports (Maybe?)
- Keyboard shortcuts
- Run Roam Template or SmartBlock routine after Toggl Command triggered
- Tag support (Tag templates)
- Duration
- and more...

## Contributing
- Use [Discussions](https://github.com/vandermerwed/roam-depot-toggl-track/discussions) to add and vote on features
- Use [Issues](https://github.com/vandermerwed/roam-depot-toggl-track/issues) to report bugs
- Pull requests welcome!

## Support my work
You can also [support this extension](https://paypal.me/DanielvanderMerwe) by buying the coffee that fuels the code I write ❤️☕
