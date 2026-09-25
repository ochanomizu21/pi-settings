import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Editor, type EditorTheme, Key, matchesKey, Text, visibleWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { Type } from "typebox";

type Option = { value: string; label: string; description?: string };
type DisplayOption = Option & { isOther?: boolean };
type Answer = { value: string; label: string; wasCustom: boolean };

type Details = {
	title: string;
	question: string;
	answer: Answer | null;
	cancelled: boolean;
};

const optionSchema = Type.Object({
	value: Type.String({ description: "Value returned after selection" }),
	label: Type.String({ description: "Option label" }),
	description: Type.Optional(Type.String({ description: "Full option explanation, displayed with word wrapping" })),
});

const paramsSchema = Type.Object({
	title: Type.String({ description: "Short question title" }),
	description: Type.Optional(Type.String({ description: "Context displayed above the question" })),
	question: Type.String({ description: "The decision question" }),
	options: Type.Array(optionSchema, { minItems: 1, description: "Radio choices" }),
	allowOther: Type.Optional(Type.Boolean({ description: "Show an Other option for typed answers; defaults to true" })),
});

function textResult(text: string, details: Details) {
	return { content: [{ type: "text" as const, text }], details };
}

export default function grillQuestion(pi: ExtensionAPI) {
	pi.registerTool({
		name: "grill_question",
		label: "Grill question",
		description: "Ask one grilling decision question with fully word-wrapped option descriptions. Use only during a grilling interview.",
		promptSnippet: "Ask one grilling decision question with fully visible, word-wrapped descriptions",
		promptGuidelines: [
			"Use grill_question, not ask_user_question, for every question while following the grilling skill.",
			"Use exactly one grill_question call at a time and immediately continue the interview after its result.",
		],
		parameters: paramsSchema,
		executionMode: "sequential",

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const baseDetails: Omit<Details, "answer" | "cancelled"> = {
				title: params.title,
				question: params.question,
			};
			if (ctx.mode !== "tui") {
				return textResult("Cannot ask an interactive grilling question outside Pi's TUI.", {
					...baseDetails,
					answer: null,
					cancelled: true,
				});
			}

			const options: DisplayOption[] = [...params.options];
			if (params.allowOther !== false) options.push({ value: "__other__", label: "Other — type an answer", isOther: true });

			const result = await ctx.ui.custom<Answer | null>((tui, theme, _keybindings, done) => {
				let selected = 0;
				let editing = false;
				let cachedLines: string[] | undefined;
				const editorTheme: EditorTheme = {
					borderColor: (s) => theme.fg("accent", s),
					selectList: {
						selectedPrefix: (s) => theme.fg("accent", s),
						selectedText: (s) => theme.fg("accent", s),
						description: (s) => theme.fg("muted", s),
						scrollInfo: (s) => theme.fg("dim", s),
						noMatch: (s) => theme.fg("warning", s),
					},
				};
				const editor = new Editor(tui, editorTheme);

				const refresh = () => {
					cachedLines = undefined;
					tui.requestRender();
				};
				editor.onSubmit = (value) => {
					const answer = value.trim();
					if (answer) done({ value: answer, label: answer, wasCustom: true });
				};

				const handleInput = (data: string) => {
					if (editing) {
						if (matchesKey(data, Key.escape)) {
							editing = false;
							editor.setText("");
							refresh();
							return;
						}
						editor.handleInput(data);
						refresh();
						return;
					}
					if (matchesKey(data, Key.up)) {
						selected = Math.max(0, selected - 1);
						refresh();
					} else if (matchesKey(data, Key.down)) {
						selected = Math.min(options.length - 1, selected + 1);
						refresh();
					} else if (matchesKey(data, Key.enter)) {
						const option = options[selected];
						if (option.isOther) {
							editing = true;
							refresh();
						} else {
							done({ value: option.value, label: option.label, wasCustom: false });
						}
					} else if (matchesKey(data, Key.escape)) {
						done(null);
					}
				};

				const render = (width: number) => {
					if (cachedLines) return cachedLines;
					const lines: string[] = [];
					const renderWidth = Math.max(1, width);
					const addWrapped = (prefix: string, text: string) => {
						const prefixWidth = visibleWidth(prefix);
						const wrapped = wrapTextWithAnsi(text, Math.max(1, renderWidth - prefixWidth));
						for (let i = 0; i < wrapped.length; i++) lines.push(`${i === 0 ? prefix : " ".repeat(prefixWidth)}${wrapped[i]}`);
					};

					lines.push(theme.fg("accent", "─".repeat(renderWidth)));
					addWrapped(" ", theme.fg("accent", theme.bold(params.title)));
					if (params.description) {
						lines.push("");
						addWrapped(" ", theme.fg("muted", params.description));
					}
					lines.push("");
					addWrapped(" ", theme.fg("text", params.question));
					lines.push("");
					options.forEach((option, index) => {
						const active = index === selected;
						const prefix = active ? theme.fg("accent", "> ") : "  ";
						addWrapped(prefix, theme.fg(active ? "accent" : "text", `${index + 1}. ${option.label}`));
						if (option.description) addWrapped("     ", theme.fg("muted", option.description));
					});
					if (editing) {
						lines.push("");
						addWrapped(" ", theme.fg("muted", "Your answer:"));
						for (const line of editor.render(Math.max(1, renderWidth - 2))) lines.push(` ${line}`);
					}
					lines.push("");
					addWrapped(" ", theme.fg("dim", editing ? "Enter to submit • Esc to go back" : "↑↓ navigate • Enter select • Esc cancel"));
					lines.push(theme.fg("accent", "─".repeat(renderWidth)));
					cachedLines = lines;
					return lines;
				};

				return { render, handleInput, invalidate: () => { cachedLines = undefined; } };
			});

			if (!result) return textResult("User cancelled the grilling question.", { ...baseDetails, answer: null, cancelled: true });
			const response = result.wasCustom ? `User wrote: ${result.label}` : `User selected: ${result.label}`;
			return textResult(response, { ...baseDetails, answer: result, cancelled: false });
		},

		renderCall(args, theme) {
			return new Text(`${theme.fg("toolTitle", theme.bold("grill_question "))}${theme.fg("muted", args.title)}`, 0, 0);
		},
		renderResult(result, _options, theme) {
			const details = result.details as Details | undefined;
			if (!details?.answer) return new Text(theme.fg("warning", "Cancelled"), 0, 0);
			const prefix = details.answer.wasCustom ? "(wrote) " : "";
			return new Text(`${theme.fg("success", "✓ ")}${theme.fg("accent", prefix + details.answer.label)}`, 0, 0);
		},
	});
}
