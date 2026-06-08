/** FE dev 서버 포트 (`package.json` `next dev -p`) */
export const FE_DEV_PORT = 4002;

/** BE 기본 포트 (Swagger·Nest `PORT` 기본값) */
export const BE_DEFAULT_ORIGIN = "http://localhost:4003";

function stripApiV1Suffix(value: string): string {
  return value.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
}

/**
 * API 프록시·SSR용 BE origin.
 * `API_PROXY_TARGET`이 FE dev 포트(4002)를 가리키면 자기 자신으로 프록시되어 500이 나므로 BE(4003)로 보정.
 */
export function resolveBackendOrigin(): string {
  const raw =
    process.env.API_PROXY_TARGET ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    BE_DEFAULT_ORIGIN;

  const trimmed = stripApiV1Suffix(raw.trim());
  if (!trimmed) return BE_DEFAULT_ORIGIN;

  try {
    const url = new URL(
      trimmed.startsWith("http") ? trimmed : `http://${trimmed}`,
    );
    const port = url.port
      ? Number(url.port)
      : url.protocol === "https:"
        ? 443
        : 80;

    if (port === FE_DEV_PORT) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[backend-origin] API_PROXY_TARGET(${trimmed})이 FE dev 포트(${FE_DEV_PORT})입니다. ` +
            `${BE_DEFAULT_ORIGIN} 으로 대체합니다.`,
        );
      }
      return BE_DEFAULT_ORIGIN;
    }

    const host = url.port
      ? `${url.hostname}:${url.port}`
      : url.hostname;
    return `${url.protocol}//${host}`;
  } catch {
    return BE_DEFAULT_ORIGIN;
  }
}

export function resolveBackendApiBaseUrl(): string {
  return `${resolveBackendOrigin()}/api/v1`;
}
