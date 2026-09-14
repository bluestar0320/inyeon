"use client";

import { useState } from "react";

import MomentEditor from "@/components/MomentEditor";
import { emptyMoment } from "@/lib/store";

export default function NewMomentPage() {
  const [initial] = useState(emptyMoment);

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-xl font-semibold tracking-tight text-ink-900">순간 추가</h1>
      <MomentEditor initial={initial} />
    </div>
  );
}
