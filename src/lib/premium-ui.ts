import type { StringKey } from "./i18n";

export type PaymentStatusName = "pending" | "approved" | "rejected";

export const STATUS_LABEL: Record<PaymentStatusName, StringKey> = {
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
};

export const STATUS_STYLE: Record<PaymentStatusName, string> = {
  pending: "bg-warn/15 text-warn",
  approved: "bg-success/15 text-success",
  rejected: "bg-error/15 text-error",
};

export const formatLak = (n: number) => `${n.toLocaleString("en-US")} ₭`;
