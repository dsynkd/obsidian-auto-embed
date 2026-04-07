import AutoEmbedPlugin from "src/main";
import { App, PluginSettingTab, Setting } from "obsidian";

export enum FallbackOptions {
    ShowErrorMessage, // Default
    EmbedLink,
    Hide,
}

export enum GoogleDocsViewOptions {
    Preview,
    EditMinimal,
    EditDefault,
}

export enum PreloadOptions {
    None,
    Placeholder,
    Placeholder_ClickToLoad,
    // Thumbnail,
    // Thumbnail_ClickToLoad,
}

// export type SupportedWebsites = "CodePen" | "Google Docs" | "Imgur" | "Reddit" | "SoundCloud" | "Spotify" | "Steam" | "TikTok" | "Twitter/X" | "YouTube";

const supportedWebsites = [ "Twitter/X", "Imgur", "Reddit", "CodePen", "Google Docs", "SoundCloud", "Spotify", "Steam", "TikTok", "Instagram" ] as const;
export type SupportedWebsites = (typeof supportedWebsites)[number];

export interface PluginSettings {
	// General
    preloadOption: PreloadOptions;
    suggestEmbed: boolean;

    // Google Docs
    googleDocsViewOption: GoogleDocsViewOptions;

    // Fallback - Shows this when the link isn't supported
    fallbackOptions: FallbackOptions;
    fallbackWidth: string;
    fallbackHeight: string;
    fallbackDefaultLink: string;
    fallbackAutoTitle: boolean;

    // Advanced settings
    showAdvancedSettings: boolean;
    debug: boolean; // Shows debug text in console
}

export const DEFAULT_SETTINGS: PluginSettings = {
    preloadOption: PreloadOptions.Placeholder,
    suggestEmbed: true,

    googleDocsViewOption: GoogleDocsViewOptions.Preview,

    fallbackOptions: FallbackOptions.EmbedLink,
    fallbackWidth: "100%",
    fallbackHeight: "500px",
    fallbackDefaultLink: "Link",
    fallbackAutoTitle: true,

    showAdvancedSettings: false,
    debug: false,
}

export class AutoEmbedSettingTab extends PluginSettingTab {
	plugin: AutoEmbedPlugin;

	constructor(app: App, plugin: AutoEmbedPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
    
	display(): void {
		const {containerEl} = this;
        // To shorten the code
        const plugin = this.plugin;
        const settings = this.plugin.settings;

		containerEl.empty();

        // Takes in a enum and converts it to a record with the key and value
        function EnumToRecord<T extends {[key: number]: string | number}>(e: T): Record<string, string>  {
            const recordOutput: Record<string, string> = {};
            for (const option in e) {
                // Don't add if its a key (number)
                if (!isNaN(Number(option)))
                    continue;
                
                const displayText = option.replace(/([a-z0-9])([A-Z])/g, (match: string, p1: string, p2: string) => `${p1} ${p2.toLowerCase()}`);
                recordOutput[option] = displayText;
            }

            return recordOutput;
        }

        const preloadOptions = EnumToRecord(PreloadOptions);
        Object.entries(preloadOptions).forEach(([key, value]) => {
            preloadOptions[key] = value.replace("_", " + "); 
        });

        new Setting(containerEl)
            .setName("Preload options")
            .setDesc("Choose how the embed behaves before loading.")
            .addDropdown(dropdown => dropdown
                .addOptions(preloadOptions)
                .setValue(PreloadOptions[settings.preloadOption])
                .onChange(async (value) => {
                    settings.preloadOption = PreloadOptions[value as keyof typeof PreloadOptions];
                    await this.plugin.saveSettings();
                })
            );
            
        new Setting(containerEl)
            .setName("Suggest embed")
            .setDesc("If you are pasting a link, suggest to embed it.")
            .addToggle(toggle => toggle
                .setValue(settings.suggestEmbed)
                .onChange(async (value) => {
                    settings.suggestEmbed = value;
                    if (settings.suggestEmbed)
                        plugin.registerSuggest();
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Google Docs")
            .setHeading()
            .setDesc("Note that when the view options is set to editable, the default page width is too small. Try to use \"Preview\" where possible");
        const googleDocsViewOptionDesc = new DocumentFragment();
        googleDocsViewOptionDesc.appendText("Preview - Uneditable, only embed the content");
        googleDocsViewOptionDesc.appendChild(createEl("br"))
        googleDocsViewOptionDesc.appendText("Edit minimal - Editable but don't show the header and toolbar");
        googleDocsViewOptionDesc.appendChild(createEl("br"))
        googleDocsViewOptionDesc.appendText("Edit default - Editable and shows the header and toolbar");
        
        new Setting(containerEl)
            .setName("Google Docs view options")
            .setDesc(googleDocsViewOptionDesc)
            .addDropdown(dropdown => dropdown
                .addOptions(EnumToRecord(GoogleDocsViewOptions))
                .setValue(GoogleDocsViewOptions[settings.googleDocsViewOption])
                .onChange(async (value) => {
                    settings.googleDocsViewOption = GoogleDocsViewOptions[value as keyof typeof GoogleDocsViewOptions];
                    await this.plugin.saveSettings();
                }))
        
        new Setting(containerEl)
            .setName("Fallback")
            .setHeading()
        
        const fallbackEmbedSettings: Setting[] = [];

        function UpdateFallbackEmbedVisibility() {
            fallbackEmbedSettings.forEach(setting => {
                setting.settingEl.style.display = settings.fallbackOptions === FallbackOptions.EmbedLink ? "flex" : "none";
            })
        }

        new Setting(containerEl)
            .setName("Fallback options")
            .addDropdown(dropdown => dropdown
                .addOptions(EnumToRecord(FallbackOptions))
                .setValue(FallbackOptions[settings.fallbackOptions])
                .onChange(async (value) => {
                    settings.fallbackOptions = FallbackOptions[value as keyof typeof FallbackOptions];
                    UpdateFallbackEmbedVisibility();
                    
                    await this.plugin.saveSettings();
                }))

        new Setting(containerEl)
            .setName("Default width")
            .setDesc("Default is 100%, filling the width of the viewport")
            .addText(text => text
                .setValue(settings.fallbackWidth)
                .setPlaceholder("100%")
                .onChange(async (value) => {
                    settings.fallbackWidth = value;
                    await this.plugin.saveSettings();
                })
            )

        new Setting(containerEl)
            .setName("Default height")
            .setDesc("Default is 500px. Set to 100vh if u want it to be the height of the viewport")
            .addText(text => text
                .setValue(settings.fallbackHeight)
                .setPlaceholder("500px")
                .onChange(async (value) => {
                    settings.fallbackHeight = value;
                    await this.plugin.saveSettings();
                })
            )

        fallbackEmbedSettings.push(new Setting(containerEl)
            .setName("Auto link title")
            .setDesc("Automatically fetches and displays the title below the embed when a custom title isn’t set")
            .addToggle(toggle => toggle
                .setValue(settings.fallbackAutoTitle)
                .onChange(async (value) => {
                    settings.fallbackAutoTitle = value;
                    await this.plugin.saveSettings();
                })
            )
        )

        
        const defaultTitleDescription = new DocumentFragment();
        defaultTitleDescription.appendText("Default text when 'Auto link title' is false OR no title is found.");
        defaultTitleDescription.appendChild(createEl("br"))
        defaultTitleDescription.appendText("Set 'Auto link title' to false and clear 'Default title' to remove the link.");

        fallbackEmbedSettings.push(new Setting(containerEl)
            .setName("Default title")
            .setDesc(defaultTitleDescription)
            .addText(text => text
                .setValue(settings.fallbackDefaultLink)
                .setPlaceholder("Link")
                .onChange(async (value) => {
                    settings.fallbackDefaultLink = value;
                    await this.plugin.saveSettings();
                })
            )
        )

        UpdateFallbackEmbedVisibility();
            
	}
    
    // TODO: Reload markdown after closing settings
    // hide() {
        // console.log("Hiding settings");
        // this.plugin.app.workspace.updateOptions();
    // }
}