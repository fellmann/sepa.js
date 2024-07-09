export enum PainType {
  Transfer = "Transfer",
  DirectDebit = "DirectDebit",
}

export interface PainFormat {
  type: PainType;
  painFormat: string;
  useBICFI?: boolean;
  useBatchBooking?: boolean;
  requestedExecutionDatePlain?: boolean;
  rootElement: string;
}

export const PainFormats = {
  "pain.001.001.03": {
    type: PainType.Transfer,
    painFormat: "pain.001.001.03",
    rootElement: "CstmrCdtTrfInitn",
    useBatchBooking: true,
    requestedExecutionDatePlain: true,
  } as PainFormat,
  "pain.001.001.08": {
    type: PainType.Transfer,
    painFormat: "pain.001.001.08",
    rootElement: "CstmrCdtTrfInitn",
    useBatchBooking: true,
    useBICFI: true,
  } as PainFormat,
  "pain.001.001.09": {
    type: PainType.Transfer,
    painFormat: "pain.001.001.09",
    rootElement: "CstmrCdtTrfInitn",
    useBatchBooking: true,
    useBICFI: true,
  } as PainFormat,
  "pain.008.001.02": {
    painFormat: "pain.008.001.02",
    type: PainType.DirectDebit,
    rootElement: "CstmrDrctDbtInitn",
    useBICFI: false,
  } as PainFormat,
  "pain.008.001.08": {
    painFormat: "pain.008.001.08",
    type: PainType.DirectDebit,
    rootElement: "CstmrDrctDbtInitn",
    useBICFI: true,
    useBatchBooking: true,
  } as PainFormat,
} as const;

export type PainFormatName = keyof typeof PainFormats;
