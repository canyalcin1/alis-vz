import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDocuments, getSamples, getRequests } from "@/lib/db";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const [docs, samples, requests] = await Promise.all([
    getDocuments(),
    getSamples(),
    getRequests(),
  ]);

  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const recentDocs = docs
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
    .slice(0, 5);

  return NextResponse.json({
    stats: {
      documentCount: docs.length,
      sampleCount: samples.length,
      pendingRequests,
      totalRequests: requests.length,
    },
    recentDocuments: recentDocs,
  });
}
