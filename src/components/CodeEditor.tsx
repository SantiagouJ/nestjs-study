"use client";

import Editor, { type Monaco } from "@monaco-editor/react";
import { useCallback, useEffect, useRef } from "react";
import type { ExerciseFile } from "@/lib/types";
import { useTheme } from "@/lib/theme";

interface CodeEditorProps {
  file: ExerciseFile;
  content: string;
  onChange?: (value: string) => void;
}

/**
 * Editor de código (Monaco) con tema personalizado inspirado en la paleta
 * neutra de la plataforma. Carga Monaco desde el CDN del loader por defecto.
 */
export default function CodeEditor({
  file,
  content,
  onChange,
}: CodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);
  const { theme } = useTheme();

  const handleMount = useCallback((monaco: Monaco) => {
    monacoRef.current = monaco;
    monaco.editor.defineTheme("affine-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0f0f0f",
        "editor.foreground": "#e5e5e5",
        "editorLineNumber.foreground": "#3d3d3d",
        "editorLineNumber.activeForeground": "#737373",
        "editor.lineHighlightBackground": "#151515",
        "editorCursor.foreground": "#d4d4d4",
        "editor.selectionBackground": "#2a2a2a",
        "editor.inactiveSelectionBackground": "#1f1f1f",
        "editorIndentGuide.background": "#1c1c1c",
        "editorIndentGuide.activeBackground": "#262626",
        "editorWidget.background": "#131313",
        "editorWidget.border": "#262626",
        "editorSuggestWidget.selectedBackground": "#1a1a1a",
        "editorBracketMatch.background": "#262626",
        "editorBracketMatch.border": "#404040",
      },
    });
    monaco.editor.defineTheme("affine-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#f7f7f5",
        "editor.foreground": "#1a1a1a",
        "editorLineNumber.foreground": "#bdbdb8",
        "editorLineNumber.activeForeground": "#525252",
        "editor.lineHighlightBackground": "#efefed",
        "editorCursor.foreground": "#1a1a1a",
        "editor.selectionBackground": "#e4e4e0",
        "editor.inactiveSelectionBackground": "#eeeee8",
        "editorIndentGuide.background": "#e4e4e0",
        "editorIndentGuide.activeBackground": "#d4d4d0",
        "editorWidget.background": "#ffffff",
        "editorWidget.border": "#e4e4e0",
        "editorSuggestWidget.selectedBackground": "#f3f3f1",
        "editorBracketMatch.background": "#e4e4e0",
        "editorBracketMatch.border": "#bdbdb8",
      },
    });

    const ts = monaco.languages.typescript.typescriptDefaults;
    ts.setCompilerOptions({
      ...ts.getCompilerOptions(),
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    });
    ts.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSuggestionDiagnostics: true,
      noSyntaxValidation: false,
    });
  }, []);

  useEffect(() => {
    monacoRef.current?.editor.setTheme(
      theme === "light" ? "affine-light" : "affine-dark",
    );
  }, [theme]);

  const handleChange = useCallback(
    (value: string | undefined) => {
      onChange?.(value ?? "");
    },
    [onChange],
  );

  return (
    <Editor
      height="100%"
      theme={theme === "light" ? "affine-light" : "affine-dark"}
      path={file.path}
      language={file.language === "typescript" ? "typescript" : file.language}
      value={content}
      options={{
        automaticLayout: true,
        fontSize: 13,
        fontFamily:
          "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        padding: { top: 16, bottom: 16 },
        scrollBeyondLastLine: false,
        renderLineHighlight: "line",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        tabSize: 2,
        wordWrap: "on",
        folding: true,
        lineNumbersMinChars: 3,
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        readOnly: file.readOnly ?? false,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
      }}
      beforeMount={handleMount}
      onChange={handleChange}
    />
  );
}
