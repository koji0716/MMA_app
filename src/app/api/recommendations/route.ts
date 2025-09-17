import { NextResponse } from "next/server";

export async function GET() {
  const data = {
    date: new Date().toISOString().slice(0, 10),
    top3: [
      { technique_id: "double_leg", reason: ["review_due"], drills: ["ペネト3×10", "角度2×3R"] },
      { technique_id: "knee_slide_pass", reason: ["tech_gap"], drills: ["解除→スライド 2×3R"] },
      { technique_id: "jab_cross_low_kick", reason: ["balance_fix"], drills: ["シャドウ3R"] },
    ],
    warnings: [],
    hasSessionTomorrow: false,
  };
  return NextResponse.json(data);
}
