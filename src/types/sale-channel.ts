export type SalesChannel = {
  id: string;
  name: string;
  platformFeeRate: number;
  storeName: string | null;
  storeUrl: string | null;
  createdAtIso: string;
  updatedAtIso: string;
};

export type SalesChannelSummary = Pick<
  SalesChannel,
  "id" | "name" | "platformFeeRate" | "storeName" | "storeUrl"
>;

export type SalesChannelInput = {
  name: string;
  platformFeeRate: number;
  storeName?: string | null;
  storeUrl?: string | null;
};

export const DEFAULT_PLATFORM_FEE_RATE = 0.0636;
