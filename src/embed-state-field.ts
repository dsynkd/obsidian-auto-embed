import { syntaxTree } from "@codemirror/language"
import { EditorState, Extension, RangeSetBuilder, StateField, Transaction } from "@codemirror/state"
import { Decoration, DecorationSet, EditorView } from "@codemirror/view"
import { EmbedWidget } from "./embed-widget";
import { EmbedManager } from "./embeds/embedManager";
import { editorLivePreviewField, TFile } from "obsidian";
import { isLinkToImage, isURL } from "./utility";

const formattingImageMarkerRegex = /formatting_formatting-image_image_image-marker(?:_list-\d*)?$/;
const stringUrlRegex = /^(?:list-\d*_)?string_url$/;
const wikilinkEmbedRegex = /!\[\[([^\]]+)\]\]/g;

function resolveVaultEmbedTarget(rawUrl: string): { resourceUrl: string; file: TFile } | null {
    if (isURL(rawUrl))
        return null;

    const plugin = EmbedManager.Instance.plugin;
    const app = plugin?.app;
    if (!app)
        return null;

    const activeFile = app.workspace.getActiveFile();
    const sourcePath = activeFile?.path ?? "";

    // Internal links may include aliases, heading and block references.
    const linkPath = rawUrl.split("|")[0].split("#")[0].trim();
    if (!linkPath)
        return null;

    const targetFile = app.metadataCache.getFirstLinkpathDest(linkPath, sourcePath);
    if (!(targetFile instanceof TFile))
        return null;

    return { resourceUrl: app.vault.getResourcePath(targetFile), file: targetFile };
}

function resolveEmbedLink(rawUrl: string): string | null {
    if (isURL(rawUrl))
        return rawUrl;

    return resolveVaultEmbedTarget(rawUrl)?.resourceUrl ?? null;
}

function buildEmbedDecorations(state: EditorState): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();

    let altTextStartPos: number | null = null;
    syntaxTree(state).iterate({
        enter(node) {
            if (formattingImageMarkerRegex.test(node.type.name)) {
                altTextStartPos = node.to + 1;
            }
            else if (stringUrlRegex.test(node.type.name)) {
                if (altTextStartPos === null)
                    return;

                const rawUrl = state.sliceDoc(node.from, node.to);
                const alt = altTextStartPos ? state.sliceDoc(altTextStartPos, node.from - 2) : "";

                altTextStartPos = null;

                const resolvedUrl = resolveEmbedLink(rawUrl);
                if (!resolvedUrl || isLinkToImage(resolvedUrl))
                    return;

                const embedData = EmbedManager.getEmbedData(resolvedUrl, alt);

                if (embedData === null)
                    return;

                const replaceFrom = node.to + 1;

                builder.add(
                    replaceFrom,
                    replaceFrom,
                    Decoration.replace({
                        widget: new EmbedWidget(embedData, resolvedUrl, alt),
                        block: true
                    })
                );
            }
        },
    });

    const fullText = state.doc.toString();
    for (const match of fullText.matchAll(wikilinkEmbedRegex)) {
        const fullMatch = match[0];
        const innerLink = match[1]?.trim();
        const matchIndex = match.index;
        if (!innerLink || matchIndex === undefined)
            continue;

        const resolved = resolveVaultEmbedTarget(innerLink);
        if (!resolved || isLinkToImage(resolved.resourceUrl))
            continue;

        const embedData = EmbedManager.getEmbedData(resolved.resourceUrl, "", {
            fromWikilink: true,
            resolvedVaultFile: resolved.file,
        });
        if (embedData === null)
            continue;

        const replaceFrom = matchIndex + fullMatch.length;
        builder.add(
            replaceFrom,
            replaceFrom,
            Decoration.replace({
                widget: new EmbedWidget(embedData, resolved.resourceUrl, ""),
                block: true
            })
        );
    }

    return builder.finish();
}

// For Live Preview
export const embedField = StateField.define<DecorationSet>({
    create(state): DecorationSet {
        if (!state.field(editorLivePreviewField))
            return Decoration.none;

        return buildEmbedDecorations(state);
    },
    update(oldState: DecorationSet, transaction: Transaction): DecorationSet {
        const live = transaction.state.field(editorLivePreviewField);
        const liveWas = transaction.startState.field(editorLivePreviewField);

        if (!live)
            return Decoration.none;

        if (!liveWas && live)
            return buildEmbedDecorations(transaction.state);

        if (!transaction.docChanged && !transaction.reconfigured)
            return oldState;

        return buildEmbedDecorations(transaction.state);
    },
    provide(field: StateField<DecorationSet>): Extension {
        return EditorView.decorations.from(field);
    }
})
