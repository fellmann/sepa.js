import {
  assert,
  assert_fixed,
  assert_iban,
  assert_length,
  assert_range,
  assert_valid_sepa_id,
} from "../../Assertions";
import { PainFormat } from "../PainFormat";
import { PainXmlConfiguration, PainXmlSerializable } from "../PainXmlFile";
import { SepaPostalAddress } from "../shared/SepaPostalAddress";
import { SepaPurposeCode } from "../shared/SepaPurposeCode";
import { SepaRemittanceInfo } from "../shared/SepaRemittanceInfo";

export class SepaDirectDebitTransaction implements PainXmlSerializable {
  constructor(
    public data: {
      id: string;
      end2endId: string;
      currency: string;
      amount: number;
      purposeCode?: SepaPurposeCode;
      remittanceInfo: SepaRemittanceInfo;
      creditorName: string;
      creditorIBAN: string;
      creditorBIC?: string;
      creditorPostalAddress?: SepaPostalAddress;
      mandateId: string;
      mandateSignatureDate: Date;
    }
  ) {}

  toXmlStructure(
    configuration: PainXmlConfiguration,
    format: PainFormat
  ): object {
    if (!configuration.disableValidation) {
      assert_valid_sepa_id(
        this.data.end2endId,
        35,
        "end2endId",
        configuration?.disableCharsetValidation
      );
      assert_range(this.data.amount, 0.01, 999999999.99, "amount");
      assert(
        this.data.amount == parseFloat(this.data.amount.toFixed(2)),
        "amount has too many fractional digits"
      );

      assert_length(this.data.creditorName, undefined, 70, "creditorName");
      assert_iban(this.data.creditorIBAN, "creditorIBAN");
      assert_fixed(
        this.data.creditorBIC?.length || 0,
        [0, 8, 11],
        "creditorBIC"
      );
      var countryMatches =
        !this.data.creditorBIC ||
        this.data.creditorBIC.substring(4, 2) ===
          this.data.creditorIBAN.substring(0, 2);
      assert(countryMatches, "country mismatch in BIC/IBAN");

      if (typeof this.data.remittanceInfo === "string")
        assert_length(
          this.data.remittanceInfo,
          undefined,
          140,
          "remittanceInfo"
        );
    }

    return {
      PmtId: {
        InstrId: this.data.id,
        EndToEndId: this.data.end2endId,
      },
      InstdAmt: {
        "@Ccy": this.data.currency,
        "#text": this.data.amount.toFixed(2),
      },
      DbtrAgt: this.data.creditorBIC
        ? {
            FinInstnId: {
              [format.useBICFI ? "BICFI" : "BIC"]: this.data.creditorBIC,
            },
          }
        : {
            FinInstnId: {
              Othr: {
                Id: "NOTPROVIDED",
              },
            },
          },
      Dbtr: {
        Nm: this.data.creditorName,
        PstlAdr: this.data.creditorPostalAddress?.toXmlStructure(configuration),
      },
      DbtrAcct: {
        Id: {
          IBAN: this.data.creditorIBAN,
        },
      },
      ...this.data.remittanceInfo.toXmlStructure(configuration),
      ...this.data.purposeCode?.toXmlStructure(configuration),
    };
  }
}
