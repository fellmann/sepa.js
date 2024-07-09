import { assert_length } from "../../Assertions";
import { PainXmlConfiguration, PainXmlSerializable } from "../PainXmlFile";

export class SepaRemittanceInfo implements PainXmlSerializable {
  constructor(
    private data:
      | {
          typeCode: string;
          issuer?: string;
          reference: string;
        }
      | string
  ) {}

  toXmlStructure(config: PainXmlConfiguration): object {
    if (!config.disableValidation) {
      if (typeof this.data === "string") {
        assert_length(this.data, undefined, 140, "remittanceInfo");
      } else {
        assert_length(this.data.typeCode, undefined, 35, "typeCode");
        assert_length(this.data.issuer, undefined, 35, "issuer");
        assert_length(this.data.reference, undefined, 35, "reference");
      }
    }

    return {
      RmtInf:
        typeof this.data === "string"
          ? { Ustrd: this.data }
          : {
              Strd: {
                CdtrRefInf: {
                  Tp: {
                    CdOrPrtry: {
                      Cd: this.data.typeCode,
                    },
                  },
                  Issr: this.data.issuer,
                  Ref: this.data.reference,
                },
              },
            },
    };
  }
}
