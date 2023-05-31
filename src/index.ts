import Extension, { IExtensionAPI } from "./extension";

interface OnloadArgs {
  extensionAPI: IExtensionAPI
}

function onload({ extensionAPI }: OnloadArgs) {
  // console.log("Roam Toggl Track extension loaded", extensionAPI);

  window.roamTogglTrack = new Extension(extensionAPI.settings);

  extensionAPI.settings.panel.create({
    tabTitle: 'Toggl Track',
    settings: [
      {
        id: "api-token",
        name: "API Token",
        description: "Can be found at the bottom of the page on https://track.toggl.com/profile",
        action: {
          type: "input",
          placeholder: "Your Toggl API Token",
          onChange: (evt: React.ChangeEvent<HTMLInputElement>) => {
            window.roamTogglTrack.initTogglApi(evt.target.value);
          }
        }
      },
      {
        id: "workspace-id",
        name: "Workspace",
        description: "Can be found at https://track.toggl.com",
        action: {
          type: "input",
          placeholder: "Your Toggl Workspace ID",
          // onChange: (evt: Event) => { console.log("Input Changed!", evt); }
        }
      },
      {
        id: "template-running-timer",
        name: "Running Timer Template",
        description: "See 'Template Usage' below for more information",
        action: {
          type: "input",
          placeholder: "Enter your time entry template here",
          // onChange: (evt: Event) => { console.log("Input Changed!", evt); }
        }
      },
    ]
  });
}

function onunload() {
  // console.log("Roam Toggl Track extension unloaded");
  window.roamTogglTrack.unload();
}

export default {
  onload,
  onunload
};