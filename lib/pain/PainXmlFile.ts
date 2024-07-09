import { XMLBuilder } from "fast-xml-parser";
import { PainFormat, PainFormatName, PainFormats } from "./PainFormat";

const XSI_NAMESPACE = "http://www.w3.org/2001/XMLSchema-instance";
const XSI_NS = "urn:iso:std:iso:20022:tech:xsd:";

const builder = new XMLBuilder({
  attributeNamePrefix: "@",
  ignoreAttributes: false,
  textNodeName: "#text",
});

export interface PainXmlConfiguration {
  disableValidation?: boolean;
  disableCharsetValidation?: boolean;
  idSeparator: string;
}

export interface PainXmlSerializable {
  toXmlStructure(
    configuration: PainXmlConfiguration,
    format: PainFormat
  ): object | string | number;
}

export abstract class PainXmlFile implements PainXmlSerializable {
  abstract toXmlStructure(
    configuration: PainXmlConfiguration,
    format: PainFormat
  ): string | number | object;

  toXmlString(
    formatName: PainFormatName,
    configuration?: Partial<PainXmlConfiguration>
  ): string {
    const format = PainFormats[formatName];

    const file = {
      "?xml": {
        "@version": "1.0",
        "@encoding": "UTF-8",
      },
      Document: {
        "@xmlns:xsi": XSI_NAMESPACE,
        "@xsi:schemaLocation":
          XSI_NS + format.painFormat + " " + format.painFormat + ".xsd",
        "@xmlns": XSI_NS + format.painFormat,
        [format.rootElement]: this.toXmlStructure(
          {
            idSeparator: ".",
            ...configuration,
          },
          format
        ),
      },
    };
    return builder.build(file) as string;
  }
}
