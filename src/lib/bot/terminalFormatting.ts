// Chat renders plain text; xterm interprets these terminal control sequences.
// Strip unfinished sequences too, since a stream can split an escape code.
export const stripTerminalFormatting = (text: string) =>
  text
    // OSC sequences, including terminal titles and hyperlink wrappers.
    .replace(/(?:\x1b\]|\x9d)[\s\S]*?(?:\x07|\x1b\\|\x9c|$)/g, "")
    // CSI sequences, including bold/color styles and cursor controls.
    .replace(/(?:\x1b\[|\x9b)[0-?]*[ -/]*(?:[@-~]|$)/g, "")
    // Other escape sequences and non-printing controls; keep tabs/newlines.
    .replace(/\x1b[ -/]*(?:[@-~]|$)/g, "")
    .replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g, "");
