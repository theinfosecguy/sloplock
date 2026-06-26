export type XmlElement = {
  name: string;
  attributes: ReadonlyMap<string, string>;
  innerContent: string;
  sourceLine: number;
};

type RawTag = {
  name: string;
  attributes: ReadonlyMap<string, string>;
  startLine: number;
  contentStart: number;
  contentEnd: number;
  selfClosing: boolean;
};

export function parseXmlElements(content: string): XmlElement[] {
  const tags = parseRawTags(content);
  return tags.map((tag) => ({
    name: localXmlName(tag.name),
    attributes: tag.attributes,
    innerContent: tag.selfClosing
      ? ""
      : content.slice(tag.contentStart, closingTagStart(content, tag)),
    sourceLine: tag.startLine
  }));
}

export function xmlAttribute(
  element: XmlElement,
  name: string
): string | undefined {
  return element.attributes.get(name.toLowerCase());
}

export function xmlChildText(
  element: XmlElement,
  childName: string
): string | undefined {
  const escaped = childName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const pattern = new RegExp(
    `<(?:[A-Za-z_][\\w.-]*:)?${escaped}\\b[^>]*>([^<]*)</(?:[A-Za-z_][\\w.-]*:)?${escaped}>`,
    "iu"
  );
  const match = pattern.exec(element.innerContent);
  const value = match?.[1]?.trim();
  return value === undefined || value.length === 0
    ? undefined
    : decodeXmlEntities(value);
}

export function localXmlName(name: string): string {
  return name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name;
}

function parseRawTags(content: string): RawTag[] {
  const tags: RawTag[] = [];
  let cursor = 0;
  let line = 1;

  while (cursor < content.length) {
    const open = content.indexOf("<", cursor);
    if (open === -1) {
      break;
    }

    line += countLineBreaks(content.slice(cursor, open));

    if (content.startsWith("<!--", open)) {
      const end = content.indexOf("-->", open + 4);
      const next = end === -1 ? content.length : end + 3;
      line += countLineBreaks(content.slice(open, next));
      cursor = next;
      continue;
    }

    if (content.startsWith("<![CDATA[", open)) {
      const end = content.indexOf("]]>", open + 9);
      const next = end === -1 ? content.length : end + 3;
      line += countLineBreaks(content.slice(open, next));
      cursor = next;
      continue;
    }

    const nextCharacter = content[open + 1];
    if (
      nextCharacter === "/" ||
      nextCharacter === "!" ||
      nextCharacter === "?"
    ) {
      const end = findTagEnd(content, open + 1);
      const next = end === -1 ? content.length : end + 1;
      line += countLineBreaks(content.slice(open, next));
      cursor = next;
      continue;
    }

    const end = findTagEnd(content, open + 1);
    if (end === -1) {
      break;
    }

    const tagSource = content.slice(open + 1, end);
    const parsed = parseStartTag(tagSource);
    const tagLine = line;
    line += countLineBreaks(content.slice(open, end + 1));
    cursor = end + 1;

    if (parsed !== undefined) {
      tags.push({
        name: parsed.name,
        attributes: parsed.attributes,
        startLine: tagLine,
        contentStart: end + 1,
        contentEnd: content.length,
        selfClosing: parsed.selfClosing
      });
    }
  }

  return tags;
}

function parseStartTag(
  source: string
): { name: string; attributes: ReadonlyMap<string, string>; selfClosing: boolean } | undefined {
  const trimmed = source.trim();
  const selfClosing = trimmed.endsWith("/");
  const body = selfClosing ? trimmed.slice(0, -1).trimEnd() : trimmed;
  const nameMatch = /^([A-Za-z_][\w.-]*(?::[A-Za-z_][\w.-]*)?)(?:\s|$)/u.exec(
    body
  );
  const name = nameMatch?.[1];
  if (name === undefined) {
    return undefined;
  }

  return {
    name,
    attributes: parseAttributes(body.slice(name.length)),
    selfClosing
  };
}

function parseAttributes(source: string): ReadonlyMap<string, string> {
  const attributes = new Map<string, string>();
  const pattern =
    /([A-Za-z_][\w.-]*(?::[A-Za-z_][\w.-]*)?)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu;
  for (const match of source.matchAll(pattern)) {
    const rawName = match[1];
    const rawValue = match[2] ?? match[3];
    if (rawName !== undefined && rawValue !== undefined) {
      attributes.set(localXmlName(rawName).toLowerCase(), decodeXmlEntities(rawValue));
    }
  }

  return attributes;
}

function closingTagStart(content: string, tag: RawTag): number {
  const escapedName = tag.name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const pattern = new RegExp(`</${escapedName}\\s*>`, "iu");
  const match = pattern.exec(content.slice(tag.contentStart));
  if (match?.index === undefined) {
    return tag.contentEnd;
  }

  return tag.contentStart + match.index;
}

function findTagEnd(content: string, cursor: number): number {
  let quote: "\"" | "'" | undefined;

  for (let index = cursor; index < content.length; index += 1) {
    const character = content[index];
    if (character === "\"" || character === "'") {
      quote = quote === character ? undefined : quote ?? character;
      continue;
    }

    if (character === ">" && quote === undefined) {
      return index;
    }
  }

  return -1;
}

function decodeXmlEntities(input: string): string {
  return input.replace(
    /&(#x[0-9a-f]+|#\d+|quot|apos|amp|lt|gt);/giu,
    (entity, value: string) => {
      switch (value.toLowerCase()) {
        case "quot":
          return "\"";
        case "apos":
          return "'";
        case "amp":
          return "&";
        case "lt":
          return "<";
        case "gt":
          return ">";
        default:
          return numericEntityValue(value) ?? entity;
      }
    }
  );
}

function numericEntityValue(value: string): string | undefined {
  const codePoint = value.toLowerCase().startsWith("#x")
    ? Number.parseInt(value.slice(2), 16)
    : value.startsWith("#")
      ? Number.parseInt(value.slice(1), 10)
      : Number.NaN;

  if (!Number.isInteger(codePoint) || codePoint < 0) {
    return undefined;
  }

  try {
    return String.fromCodePoint(codePoint);
  } catch {
    return undefined;
  }
}

function countLineBreaks(input: string): number {
  return input.match(/\n/gu)?.length ?? 0;
}
