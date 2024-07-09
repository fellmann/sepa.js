import { assert_length } from "../../Assertions";
import { PainXmlConfiguration, PainXmlSerializable } from "../PainXmlFile";

export class SepaPurposeCode implements PainXmlSerializable {
  constructor(
    private data: {
      code: string;
    }
  ) {}

  toXmlStructure(configuration: PainXmlConfiguration): object {
    if (!configuration.disableValidation) {
      assert_length(this.data.code, 1, 4, "purposeCode");
    }
    return {
      Purp: {
        Cd: this.data.code,
      },
    };
  }
}
