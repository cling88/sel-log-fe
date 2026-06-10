export type UserSettings = {
  marginMinRate: number;
  marginMaxRate: number;
  vatExtractRate: number;
  defaultPlatformFeeRate: number;
  defaultChannelId: string | null;
};

export type UserSettingsInput = Partial<UserSettings>;

export type UnusedImagesCount = {
  count: number;
};

export type PurgeUnusedImagesResult = {
  deletedCount: number;
};

export type TrashType =
  | "purchase_product"
  | "purchase_supply"
  | "purchase_other"
  | "sale_order"
  | "income_line"
  | "product"
  | "sourcing_channel"
  | "sourcing_product";

export type TrashSummary = {
  products: number;
  sourcingChannels: number;
  sourcingProducts: number;
  purchaseProducts: number;
  purchaseSupply: number;
  purchaseOther: number;
  saleOrders: number;
  incomeLines: number;
  total: number;
};

export type PurgeTrashBody = {
  types?: TrashType[];
  items?: { type: TrashType; id: string }[];
};

export const EMPTY_TRASH_SUMMARY: TrashSummary = {
  products: 0,
  sourcingChannels: 0,
  sourcingProducts: 0,
  purchaseProducts: 0,
  purchaseSupply: 0,
  purchaseOther: 0,
  saleOrders: 0,
  incomeLines: 0,
  total: 0,
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  marginMinRate: 0.15,
  marginMaxRate: 0.5,
  vatExtractRate: 10 / 110,
  defaultPlatformFeeRate: 0.0636,
  defaultChannelId: null,
};
