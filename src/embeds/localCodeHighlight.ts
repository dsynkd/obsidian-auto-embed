import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import dart from "highlight.js/lib/languages/dart";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import go from "highlight.js/lib/languages/go";
import ini from "highlight.js/lib/languages/ini";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import lua from "highlight.js/lib/languages/lua";
import makefile from "highlight.js/lib/languages/makefile";
import markdown from "highlight.js/lib/languages/markdown";
import perl from "highlight.js/lib/languages/perl";
import php from "highlight.js/lib/languages/php";
import powershell from "highlight.js/lib/languages/powershell";
import python from "highlight.js/lib/languages/python";
import r from "highlight.js/lib/languages/r";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import scala from "highlight.js/lib/languages/scala";
import scss from "highlight.js/lib/languages/scss";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import less from "highlight.js/lib/languages/less";

let hljsReady = false;

function ensureHighlightRegistered(): void {
	if (hljsReady)
		return;
	hljsReady = true;

	hljs.registerLanguage("javascript", javascript);
	hljs.registerLanguage("typescript", typescript);
	hljs.registerLanguage("python", python);
	hljs.registerLanguage("json", json);
	hljs.registerLanguage("css", css);
	hljs.registerLanguage("scss", scss);
	hljs.registerLanguage("less", less);
	hljs.registerLanguage("xml", xml);
	hljs.registerLanguage("bash", bash);
	hljs.registerLanguage("yaml", yaml);
	hljs.registerLanguage("sql", sql);
	hljs.registerLanguage("rust", rust);
	hljs.registerLanguage("go", go);
	hljs.registerLanguage("java", java);
	hljs.registerLanguage("csharp", csharp);
	hljs.registerLanguage("cpp", cpp);
	hljs.registerLanguage("php", php);
	hljs.registerLanguage("ruby", ruby);
	hljs.registerLanguage("perl", perl);
	hljs.registerLanguage("lua", lua);
	hljs.registerLanguage("kotlin", kotlin);
	hljs.registerLanguage("swift", swift);
	hljs.registerLanguage("scala", scala);
	hljs.registerLanguage("r", r);
	hljs.registerLanguage("dart", dart);
	hljs.registerLanguage("powershell", powershell);
	hljs.registerLanguage("ini", ini);
	hljs.registerLanguage("dockerfile", dockerfile);
	hljs.registerLanguage("makefile", makefile);
	hljs.registerLanguage("markdown", markdown);
}

/** Maps classes from getLanguageClass (extension or special filename) to highlight.js language ids. */
const languageClassToHljs: Record<string, string> = {
	c: "cpp",
	cc: "cpp",
	cpp: "cpp",
	cxx: "cpp",
	h: "cpp",
	hh: "cpp",
	hpp: "cpp",
	cs: "csharp",
	java: "java",
	kt: "kotlin",
	kts: "kotlin",
	swift: "swift",
	go: "go",
	rs: "rust",
	py: "python",
	rb: "ruby",
	php: "php",
	pl: "perl",
	lua: "lua",
	r: "r",
	dart: "dart",
	scala: "scala",
	js: "javascript",
	jsx: "javascript",
	ts: "typescript",
	tsx: "typescript",
	mjs: "javascript",
	cjs: "javascript",
	json: "json",
	jsonc: "javascript",
	yaml: "yaml",
	yml: "yaml",
	toml: "ini",
	ini: "ini",
	xml: "xml",
	sql: "sql",
	html: "xml",
	css: "css",
	scss: "scss",
	sass: "scss",
	less: "less",
	sh: "bash",
	bash: "bash",
	zsh: "bash",
	fish: "bash",
	ps1: "powershell",
	vue: "xml",
	svelte: "xml",
	astro: "typescript",
	mdx: "markdown",
	dockerfile: "dockerfile",
	makefile: "makefile",
};

const autoDetectionSubset = [
	"javascript", "typescript", "python", "json", "yaml", "xml", "css", "bash",
	"rust", "go", "java", "csharp", "cpp", "php", "ruby", "sql", "markdown",
];

export function highlightLocalCodeContent(code: string, languageClass: string | null): string {
	ensureHighlightRegistered();

	const hljsLang = languageClass ? languageClassToHljs[languageClass.toLowerCase()] : undefined;
	if (hljsLang && hljs.getLanguage(hljsLang)) {
		try {
			return hljs.highlight(code, { language: hljsLang, ignoreIllegals: true }).value;
		} catch {
			// fall through
		}
	}

	try {
		return hljs.highlightAuto(code, autoDetectionSubset).value;
	} catch {
		return code;
	}
}
