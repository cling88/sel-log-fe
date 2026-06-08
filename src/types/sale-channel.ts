export type SalesChannel = {
  id: string;
  name: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type SalesChannelSummary = Pick<SalesChannel, "id" | "name">;

export type SalesChannelInput = {
  name: string;
};
