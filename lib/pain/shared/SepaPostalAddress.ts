import { assert_length } from "../../Assertions";
import { PainXmlConfiguration, PainXmlSerializable } from "../PainXmlFile";

export class SepaPostalAddress implements PainXmlSerializable {
  constructor(
    private data: {
      street?: string;
      city: string;
      country: string;
    }
  ) {}

  toXmlStructure(configuration: PainXmlConfiguration): object {
    if (!configuration.disableValidation) {
      assert_length(this.data.street, undefined, 70, "street");
      assert_length(this.data.city, undefined, 70, "city");
      assert_length(this.data.country, undefined, 2, "country");
    }
    return {
      PstlAdr: {
        Ctry: this.data.country,
        AdrLine: [this.data.street, this.data.city].filter(Boolean),
      },
    };
  }
}
