import { NextRequest, NextResponse } from "next/server";

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "pywcmzqls0";
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  if (!NAVER_CLIENT_SECRET) {
    console.error("NAVER_CLIENT_SECRET not found in env");
    return NextResponse.json(
      { error: "NAVER_CLIENT_SECRET is not configured" },
      { status: 500 },
    );
  }

  console.log("Geocode request - Client ID:", NAVER_CLIENT_ID);
  console.log("Geocode request - Secret exists:", !!NAVER_CLIENT_SECRET);

  try {
    const response = await fetch(
      `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${query}`,
      {
        headers: {
          "X-NCP-APIGW-API-KEY-ID": NAVER_CLIENT_ID,
          "X-NCP-APIGW-API-KEY": NAVER_CLIENT_SECRET,
        },
      },
    );

    console.log("Naver API response status:", response.status);

    const data = await response.json();

    // Naver API 에러 응답 처리 (401, 403 등)
    if (!response.ok || data.errorCode || data.error) {
      const errorMsg =
        data.message || data.error?.message || `API 오류 (${response.status})`;
      console.error("Naver API error:", response.status, data);
      return NextResponse.json(
        { error: errorMsg },
        { status: response.status || 400 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json(
      { error: "Failed to geocode address" },
      { status: 500 },
    );
  }
}
