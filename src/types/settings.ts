export type UserSettings = {
  marginMinRate: number;
  marginMaxRate: number;
  vatExtractRate: number;
  defaultPlatformFeeRate: number;
  defaultChannelId: string | null;
};

export type UserSettingsInput = Partial<UserSettings>;

export const DEFAULT_USER_SETTINGS: UserSettings = {
  marginMinRate: 0.15,
  marginMaxRate: 0.5,
  vatExtractRate: 10 / 110,
  defaultPlatformFeeRate: 0.0636,
  defaultChannelId: null,
};
