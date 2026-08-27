import { NextResponse } from "next/server";
import { google } from "googleapis";

// GET /api/auth/google
// 최초 1회 실행: 구글 로그인 동의 화면으로 리다이렉트합니다.
// 콜백에서 refresh token을 발급받아 .env.local에 넣으면 이후로는 이 라우트를 다시 탈 필요가 없습니다.
export async function GET() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI를 .env.local에 먼저 설정하세요." },
      { status: 500 }
    );
  }

  const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // refresh_token을 매번 새로 받기 위해 필요
    scope: ["https://www.googleapis.com/auth/drive.file"],
  });

  return NextResponse.redirect(url);
}
