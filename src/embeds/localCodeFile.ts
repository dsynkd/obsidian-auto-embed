import { TFile } from "obsidian";
import { BaseEmbedData, EmbedBase, EmbedLinkContext } from "./embedBase";
import { highlightLocalCodeContent } from "./localCodeHighlight";

const CODE_FILE_EXTENSIONS = new Set([
	"c", "cc", "cpp", "cxx", "h", "hh", "hpp",
	"cs", "java", "kt", "kts", "swift", "go", "rs",
	"py", "rb", "php", "pl", "lua", "r", "dart", "scala",
	"js", "jsx", "ts", "tsx", "mjs", "cjs",
	"json", "jsonc", "yaml", "yml", "toml", "ini", "xml", "sql",
	"html", "css", "scss", "sass", "less",
	"sh", "bash", "zsh", "fish", "ps1",
	"vue", "svelte", "astro", "mdx",
]);

const CODE_FILENAMES = new Set([
	"dockerfile",
	"makefile",
]);

function getLanguageClass(file: TFile): string | null {
	const fileName = file.name.toLowerCase();
	if (CODE_FILENAMES.has(fileName))
		return fileName;

	const extension = file.extension.toLowerCase();
	if (!extension)
		return null;

	if (extension === "yml")
		return "yaml";
	if (extension === "ps1")
		return "powershell";

	return extension;
}

export class LocalCodeFileEmbed extends EmbedBase {
	name: "Other" = "Other";
	/** Vault resource URLs from `getResourcePath` (wikilink-only at the markdown level). */
	regex = new RegExp(/^(?:app|file):\/\//);

	private getFileFromResourceUrl(url: string): TFile | null {
		const app = this.plugin.app;
		return app.vault.getFiles().find((file) => app.vault.getResourcePath(file) === url) ?? null;
	}

	private resolveCodeFile(link: string | undefined, context?: EmbedLinkContext): TFile | null {
		if (context?.resolvedVaultFile)
			return context.resolvedVaultFile;
		if (!link)
			return null;
		return this.getFileFromResourceUrl(link);
	}

	private isCodeFile(file: TFile): boolean {
		if (CODE_FILENAMES.has(file.name.toLowerCase()))
			return true;

		const extension = file.extension.toLowerCase();
		return extension.length > 0 && CODE_FILE_EXTENSIONS.has(extension);
	}

	getOptions(alt: string, link?: string, context?: EmbedLinkContext): BaseEmbedData {
		const options = super.getOptions(alt, link, context);
		if (!link) {
			options.shouldEmbed = false;
			return options;
		}

		if (!context?.fromWikilink) {
			options.shouldEmbed = false;
			return options;
		}

		const file = this.resolveCodeFile(link, context);
		if (!file || !this.isCodeFile(file)) {
			options.shouldEmbed = false;
			return options;
		}

		options.vaultFile = file;
		return options;
	}

	createEmbed(url: string, embedData?: BaseEmbedData): HTMLElement {
		const file = embedData?.vaultFile ?? this.getFileFromResourceUrl(url);
		if (!file)
			return this.onErrorCreatingEmbed(url, "Cannot find vault file for this embed.");

		const root = createDiv({ cls: "auto-embed-local-code" });
		const scroll = root.createDiv({ cls: "auto-embed-local-code-scroll" });
		const inner = scroll.createDiv({ cls: "auto-embed-local-code-inner" });
		const settings = this.plugin.settings;

		let gutter: HTMLPreElement | undefined;
		if (settings.localCodeEmbedLineNumbers) {
			root.addClass("auto-embed-local-code--numbered");
			gutter = inner.createEl("pre", { cls: "auto-embed-local-code-gutter", text: "1" });
		}

		const bodyWrap = inner.createDiv({ cls: "auto-embed-local-code-body-wrap" });
		const bodyPre = bodyWrap.createEl("pre", { cls: "auto-embed-local-code-body" });
		const code = bodyPre.createEl("code", { cls: "auto-embed-local-code-content" });

		const language = getLanguageClass(file);
		code.addClass("hljs");

		code.setText("Loading file...");

		this.plugin.app.vault.cachedRead(file).then((content) => {
			if (gutter) {
				const lines = content.split("\n");
				gutter.setText(lines.map((_, i) => String(i + 1)).join("\n"));
			}

			code.innerHTML = highlightLocalCodeContent(content, language);
		}).catch(() => {
			code.empty();
			code.setText("Unable to load file contents.");
		});

		return root;
	}
}
