import type { SaleOrder } from "@/types/sale";

/** 퍼블용 샘플 상품 ID — 상품관리 시드와 동일 */
const SAMPLE_PRODUCT_ID = "prd-sample-1";

export function createPubSeedSaleOrders(today: string): SaleOrder[] {
  const monthPrefix = today.slice(0, 7);
  const monthDay = `${monthPrefix}-02`;

  return [
    {
      id: "sale-seed-1",
      orderDate: today,
      orderNo: "SO-260604-01",
      customerName: "김민수",
      channelId: null,
      channel: null,
      items: [
        {
          productId: SAMPLE_PRODUCT_ID,
          productSku: "SKU-001",
          productName: "샘플 상품 1",
          quantity: 1,
          lineAmount: 25000,
        },
        {
          productId: SAMPLE_PRODUCT_ID,
          productSku: "SKU-001",
          productName: "샘플 상품 1",
          quantity: 1,
          lineAmount: 25000,
        },
      ],
      extraAdjustments: [],
      discountAdjustments: [],
      extraAmount: 0,
      discountAmount: 0,
      totalAmount: 50000,
      memo: "퍼블 샘플 주문",
      status: "normal",
    },
    {
      id: "sale-seed-2",
      orderDate: monthDay,
      orderNo: "SO-260602-02",
      customerName: "박지영",
      channelId: null,
      channel: null,
      items: [
        {
          productId: SAMPLE_PRODUCT_ID,
          productSku: "SKU-001",
          productName: "샘플 상품 1",
          quantity: 1,
          lineAmount: 27000,
        },
      ],
      extraAdjustments: [{ id: "adj-seed-1", label: "배송비", amount: 3000 }],
      discountAdjustments: [],
      extraAmount: 3000,
      discountAmount: 0,
      totalAmount: 30000,
      status: "cancelled",
    },
  ];
}
