export interface XmlTextNode {
  "#text": string;
}

export function getXmlText(
  x?: XmlTextNode | XmlTextNode[]
): string | undefined {
  if (Array.isArray(x)) return x.map(getXmlText).join("\n");
  if (typeof x === "object") return x["#text"];
  return undefined;
}
