export type SourcingTabId = "channels" | "products";

export type SourcingChannel = {
  id: string;
  name: string;
  url: string | null;
  memo: string;
  productCount?: number;
  createdAtIso: string;
  updatedAtIso: string;
};

export type SourcingChannelEmbed = {
  id: string;
  name: string;
  url: string | null;
};

export type CreateSourcingChannelBody = {
  name: string;
  url?: string;
  memo?: string;
};

/** @deprecated CreateSourcingChannelBody 와 동일 */
export type SourcingChannelInput = CreateSourcingChannelBody;

export type SourcingProduct = {
  id: string;
  name: string;
  imageUrl: string | null;
  productUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  memo: string;
  channelId: string | null;
  channel: SourcingChannelEmbed | null;
  createdAtIso: string;
  updatedAtIso: string;
};

export type CreateSourcingProductBody = {
  name: string;
  channelId?: string | null;
  imageUrl?: string;
  productUrl?: string;
  quantity?: number;
  /** 총 금액·개별 단가는 독립 저장 (BE가 요청값 그대로 persist) */
  totalPrice?: number;
  unitPrice?: number;
  memo?: string;
};

/** @deprecated CreateSourcingProductBody 와 동일 */
export type SourcingProductInput = CreateSourcingProductBody;
