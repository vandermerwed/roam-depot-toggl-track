import updateBlock from "roamjs-components/writes/updateBlock";
import { Intent } from "@blueprintjs/core";
import { ITimeEntry, Toggl, IMe, IWorkspaceFeatures, IClient, IWorkspaceProject, ITimeEntryParams } from "toggl-track";
import { Buffer } from 'buffer';
import formatDate from "date-fns/format";
import getUnixTime from'date-fns/getUnixTime';
// import fromUnixTime from 'date-fns/fromUnixTime';
import formatISO from "date-fns/formatISO";
// import addDate from 'date-fns/add';
import { render as renderToast } from "roamjs-components/components/Toast";
// import { addTogglStartTimerCommand } from "./components/TimerDialog/Index";
import { CommandPaletteCommands, TemplatePlaceholders } from "./constants";
import { getBlockContent } from "./utils";
import { BlockRefernce } from "./type";

export interface IExtensionAPI {
  settings: IExtensionSettings;
}

export interface IExtensionSettings {
  get: (key: string) => any;
  getAll: () => any[];
  set: (key: string, value: any) => Promise<any>;
  panel: {
    create: (config: any) => any;
  }
}

export interface ITogglUserData {
  user: IMe;
  features: IWorkspaceFeatures[];
  clients: IClient[];
  projects: IWorkspaceProject[];
}

export interface IEnrichedTimeEntry extends ITimeEntry {
  client: IClient;
  project: IWorkspaceProject;
}

export default class Extension {
  private settings: IExtensionSettings;
  private togglApi: Toggl;
  private togglUserData: ITogglUserData;

  constructor(settings: IExtensionSettings) {
    this.settings = settings;

    // Temporary workaround for "Buffer is not defined" error caused by the toggl-track library.
    global.Buffer = global.Buffer || Buffer;

    if (this.isExtensionConfigured(false)) {

      this.initTogglApi();

      this.getUserData()
        .then((userData) => {
          this.togglUserData = userData;
        })
        .catch((error) => {
          renderToast({
            id: "toggl-track-error",
            content: error,
            intent: Intent.DANGER,
          });
        });
    }

    // window.roamAlphaAPI.ui.blockContextMenu.addCommand({
    //   label: "Toggl: Start Timer",
    //   // 'display-conditional': (e) => e['block-string'].includes("Test Block"), 
    //   callback: (obj) => {
    //     console.log("Testing block context menu: ", obj);
    //   }
    // });

    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: CommandPaletteCommands.START_TIMER,
      callback: async () => {
        if (!this.isExtensionConfigured())
          return;

        // try to get current focused block
        var block = window.roamAlphaAPI.ui.getFocusedBlock() as BlockRefernce;

        // check if the user has focus on a block
        if (block) {
          // var pageTitle = getPageTitleByBlockUid(block["block-uid"]);
          const workspaceId = this.settings.get('workspace-id');
          const { clients, projects } = this.togglUserData;

          const blockText = getBlockContent(block).string;

          // Parse text to map client name to an cid
          var _likelyClientMatch = clients.find(
            c => blockText.includes(c.name)
          );

          // Parse text to map project name to an pid
          var _likelyProjectMatch = {} as IWorkspaceProject;
          var _likelyProjectMatches = projects
            .filter(p => !p.server_deleted_at)
            .filter(
              p => blockText.includes(p.name)
            );

          if (_likelyProjectMatches.length > 1 && _likelyClientMatch) {
            _likelyProjectMatch = _likelyProjectMatches.find(
              p => p.cid === _likelyClientMatch.id
            );
          } else {
            _likelyProjectMatch = _likelyProjectMatches[0] as IWorkspaceProject;
          }

          var _description = blockText;
          // RegEx replacements
          if (_likelyClientMatch) {
            var _clientHashtagRegEx = new RegExp(`#${_likelyClientMatch.name}`, "g");
            var _clientBracketsRegEx = new RegExp("\\[\\[" + _likelyClientMatch.name + "\\]\\]", "g");
            var _clientHashtagWithBracketsRegEx = new RegExp("#\\[\\[" + _likelyClientMatch.name + "\\]\\]", "g");

            _description = _description.replace(_clientHashtagWithBracketsRegEx, "");
            _description = _description.replace(_clientBracketsRegEx, "");
            _description = _description.replace(_clientHashtagRegEx, "");
          }

          if (_likelyProjectMatch) {
            var _projectHashtagRegEx = new RegExp(`#${_likelyProjectMatch.name}`, "g");
            var _projectBracketsRegEx = new RegExp("\\[\\[" + _likelyProjectMatch.name + "\\]\\]", "g");
            var _projectHashtagWithBracketsRegEx = new RegExp("#\\[\\[" + _likelyProjectMatch.name + "\\]\\]", "g");

            _description = _description.replace(_projectHashtagWithBracketsRegEx, "");
            _description = _description.replace(_projectBracketsRegEx, "");
            _description = _description.replace(_projectHashtagRegEx, "");
          }

          _description = _description.replaceAll("  ", " ");

          var _startTime = new Date();

          const body = {
            created_with: "Roam Research - Toggl Track Integration",
            workspace_id: workspaceId,
            description: _description.trim(),
            project_id: _likelyProjectMatch?.id ?? null,
            start: formatISO(_startTime, { format: "extended", representation: "complete" }),
            duration: (-1 * getUnixTime(_startTime)),
          } as ITimeEntryParams;

          await this.togglApi.timeEntry.create(workspaceId, body).then((data) => {
            if(typeof data === 'object' && data !== null){
              const enrichedCurrentEntry = this.getEnrichedTimeEntry(data);
              updateBlock({
                uid: block["block-uid"],
                text: this.formatEntry(enrichedCurrentEntry)
              });
            } else {
              console.error(data);
            }
          });
        }
      },
    });

    window.roamAlphaAPI.ui.commandPalette.addCommand({
      label: CommandPaletteCommands.GET_RUNNING_TIMER,
      callback: async () => {
        if (!this.isExtensionConfigured()) {
          return;
        }

        // try to get current focused block
        var block = window.roamAlphaAPI.ui.getFocusedBlock() as BlockRefernce;

        // check if the user has focus on a block
        if (block) {
          const currentEntry = await this.togglApi.timeEntry.current() as ITimeEntry;
          const enrichedCurrentEntry = this.getEnrichedTimeEntry(currentEntry);

          await updateBlock({
            uid: block["block-uid"],
            text: this.formatEntry(enrichedCurrentEntry)
          });
        }
      },
    });

    // addTogglStartTimerCommand();
  }

  unload() {
    for (const [_, val] of Object.entries(CommandPaletteCommands)) {
      window.roamAlphaAPI.ui.commandPalette.removeCommand({
        label: val,
      });
    }

    // window.roamAlphaAPI.ui.commandPalette.removeCommand({
    //   label: "Toggl: Test Dialog",
    // })
  }

  public initTogglApi(apiToken: string = this.settings.get('api-token')) {

    if (!apiToken) {
      return;
    }

    this.togglApi = new Toggl({
      auth: {
        token: apiToken,
      },
    });

    if (this.togglApi) {
      this.getUserData()
        .then((userData) => {
          this.togglUserData = userData;

          // set user's default workspace id if it is empty
          const workspaceId = this.settings.get('workspace-id');
          if (!workspaceId) {
            this.settings.set('workspace-id', userData.user.default_workspace_id);
          }
        })
    }
  }

  public async getUserData(): Promise<ITogglUserData> {

    const user = await this.togglApi.me.get() as IMe;
    const features = await this.togglApi.me.features() as IWorkspaceFeatures[];
    const clients = await this.togglApi.me.clients() as IClient[];
    const projects = await this.togglApi.me.projects() as IWorkspaceProject[];


    return {
      user: user,
      features: features,
      clients: clients,
      projects: projects,
    } as ITogglUserData;
  }

  private isExtensionConfigured(notify: boolean = true): boolean {
    const apiToken = this.settings.get('api-token');
    // const workspaceId = this.settings.get('workspace-id');

    if (!apiToken) {
      if (notify) {
        renderToast({
          id: "toggl-track-missing-api-token-error",
          content: "You must set your Toggl Track API Token in the extension settings.",
          intent: Intent.DANGER,
        });
      }
      return false;
    }

    // if (!workspaceId) {
    //   renderToast({
    //     id: "toggl-track-missing-workspace-id-error",
    //     content: "You must set your Toggl Track Workspace in the extension settings.",
    //     intent: Intent.DANGER,
    //   });
    //   return false;
    // }

    return true;
  }

  private getEnrichedTimeEntry(timeEntry: ITimeEntry): IEnrichedTimeEntry {
    const { clients, projects } = this.togglUserData;

    const project = projects?.find(x => x.id === timeEntry.project_id) ?? null;

    if(!project){
      return {
        ...timeEntry,
        client: null,
        project: null,
      };
    }

    const client = clients?.find(x => x.id === project.client_id) ?? null;

    return {
      ...timeEntry,
      client,
      project,
    };
  }

  private formatEntry(timeEntry: IEnrichedTimeEntry): string {
    const entryTemplate = this.settings.get('template-running-timer');

    if (!entryTemplate) {
      return timeEntry.description;
    }

    // let _tags = rmToggl.templateTags.replace('%TAGS%', entry.tags.join(", "));   

    var _return = entryTemplate
      .replaceAll(TemplatePlaceholders.START_TIME, formatDate(new Date(timeEntry.start), "HH:mm"))
      .replaceAll(TemplatePlaceholders.DESCRIPTION, timeEntry.description?.trim() ?? "")
      .replaceAll(TemplatePlaceholders.DURATION, "00:00")
      .replaceAll(TemplatePlaceholders.PROJECT, timeEntry.project?.name ?? "")
      .replaceAll(TemplatePlaceholders.CLIENT, timeEntry.client?.name ?? "")
      // .replace('%TAGS_TEMPLATE%',
      //             entry.tags && entry.tags.length > 0 ?
      //             _tags : ""
      //           )
      .replaceAll(TemplatePlaceholders.ENTRY_ID, `||${timeEntry.id}||`) // Enforcing this "||id||" format to make it easier to parse later
      .replaceAll("#[[]]", "")
      .replaceAll("[[]]", "")
      .replaceAll("\\n", "\n")
      .replaceAll("  ", " ")
      .trim();

    return _return;
  }
}