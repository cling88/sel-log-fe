import { formatAmount } from "@/lib/purchase-product-calc";
import type { SourcingChannel, SourcingProduct } from "@/types/sourcing";

function includesQuery(haystack: string, q: string): boolean {
  return haystack.toLowerCase().includes(q.toLowerCase());
}

export function filterSourcingChannels(
  channels: SourcingChannel[],
  q: string,
): SourcingChannel[] {
  const trimmed = q.trim();
  if (!trimmed) return channels;
  return channels.filter(
    (ch) =>
      includesQuery(ch.name, trimmed) ||
      (ch.url && includesQuery(ch.url, trimmed)) ||
      includesQuery(ch.memo, trimmed),
  );
}

export function filterSourcingProducts(
  products: SourcingProduct[],
  channels: SourcingChannel[],
  q: string,
): SourcingProduct[] {
  const trimmed = q.trim();
  if (!trimmed) return products;

  const channelById = new Map(channels.map((ch) => [ch.id, ch]));

  return products.filter((product) => {
    const channel = product.channelId
      ? channelById.get(product.channelId)
      : null;
    const total = product.totalPrice;
    const priceBlob = [
      String(product.quantity),
      String(product.unitPrice),
      String(total),
      formatAmount(product.unitPrice),
      formatAmount(total),
    ].join(" ");

    return (
      includesQuery(product.name, trimmed) ||
      includesQuery(product.memo, trimmed) ||
      includesQuery(priceBlob, trimmed) ||
      (channel && includesQuery(channel.name, trimmed))
    );
  });
}

export function paginateList<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
  };
}
