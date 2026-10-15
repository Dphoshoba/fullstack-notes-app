const invisibleCharacters = /[\u200B-\u200D\uFEFF]/g;

const stripControlCharacters = (value) =>
  Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code === 10 || code === 13 || code === 9 || (code >= 32 && code !== 127);
    })
    .join("");

export function sanitizeSingleLineText(value) {
  return stripControlCharacters(
    String(value ?? "")
      .normalize("NFKC")
      .replace(invisibleCharacters, "")
  )
    .replace(/\u00A0/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeMultilineText(value) {
  return stripControlCharacters(
    String(value ?? "")
      .normalize("NFKC")
      .replace(/\r\n?/g, "\n")
      .replace(invisibleCharacters, "")
  )
    .replace(/\u00A0/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}
