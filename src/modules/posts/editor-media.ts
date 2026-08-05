export type EditorMediaKind = "image" | "pdf";

export type EditorMediaFile = {
  id: string;
  filename: string;
};

function escapeImageAlt(filename: string): string {
  return filename
    .replace(/[\r\n]+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

export function uploadedMediaMarkdown(file: EditorMediaFile, kind: EditorMediaKind): string {
  const previewUrl = `/api/files/${file.id}/preview`;

  if (kind === "image") {
    return `\n![${escapeImageAlt(file.filename)}](${previewUrl})\n`;
  }

  return `\n\`\`\`pdf\n${previewUrl}\n\`\`\`\n`;
}
