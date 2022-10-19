import Extension from "./extension";

declare global {
  interface Window {
    roamTogglTrack: Extension;
  }
}

export const CommandPaletteCommands = {
  START_TIMER: "Toggl: Start Timer",
  GET_RUNNING_TIMER: "Toggl: Get Current Running Timer",
}

export const TemplatePlaceholders = {
  ENTRY_ID: "{ENTRY_ID}",
  START_TIME: "{START_TIME}",
  DESCRIPTION: "{DESCRIPTION}",
  DURATION: "{DURATION}",
  PROJECT: "{PROJECT}",
  CLIENT: "{CLIENT}",
}
