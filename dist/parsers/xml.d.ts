export type XmlElement = {
    name: string;
    attributes: ReadonlyMap<string, string>;
    innerContent: string;
    sourceLine: number;
};
export declare function parseXmlElements(content: string): XmlElement[];
export declare function xmlAttribute(element: XmlElement, name: string): string | undefined;
export declare function xmlChildText(element: XmlElement, childName: string): string | undefined;
export declare function localXmlName(name: string): string;
