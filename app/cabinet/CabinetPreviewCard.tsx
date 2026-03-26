"use client";

import { useCardBlocked } from "@/hooks/useCardBlocked";
import { CardBankVisual } from "./CardBankVisual";

export function CabinetPreviewCard({
  userId,
  cardNumber,
  cardValid,
  cardDetailsHidden,
}: {
  userId: string;
  cardNumber: string;
  cardValid: string;
  cardDetailsHidden: boolean;
}) {
  const { blocked } = useCardBlocked(userId);

  return (
    <CardBankVisual
      isBlocked={blocked}
      cardNumber={cardNumber}
      cardValid={cardValid}
      cardDetailsHidden={cardDetailsHidden}
      compact
      className="animate-float animate-scale-in"
      style={{ animationDelay: "0.2s", opacity: 0 }}
    />
  );
}
