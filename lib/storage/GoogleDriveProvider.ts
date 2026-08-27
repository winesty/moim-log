import { google } from "googleapis";
import { JsonBackedProvider } from "./JsonBackedProvider";

const FOLDER_NAME = "moim-log-data";

/**
 * 구글 드라이브를 백엔드로 쓰는 StorageProvider 구현체.
 *
 * - 사용자 드라이브에 "moim-log-data" 폴더를 하나 만들고, 그 안에
 *   people.json / places.json / categories.json / meetings.json 파일로 저장합니다.
 *   (appDataFolder가 아닌 일반 폴더를 쓰는 이유: 나중에 장소/메뉴 데이터를
 *   다른 사람과 "공유"하려면 사용자가 드라이브에서 직접 폴더/파일 공유를
 *   걸 수 있어야 하기 때문입니다.)
 * - 인증은 OAuth2 Refresh Token 방식. 최초 1회 /api/auth/google 플로우로
 *   발급받은 refresh token을 환경변수로 저장해두고 재사용합니다.
 */
export class GoogleDriveProvider extends JsonBackedProvider {
  private folderIdPromise: Promise<string> | null = null;

  private getClient() {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_REFRESH_TOKEN } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      throw new Error(
        "구글 드라이브 인증 정보가 없습니다. .env.local에 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN을 설정하세요. (README의 '구글 드라이브 연동 설정' 참고)"
      );
    }
    const oAuth2Client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
    oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
    return google.drive({ version: "v3", auth: oAuth2Client });
  }

  private async getFolderId(): Promise<string> {
    if (!this.folderIdPromise) {
      this.folderIdPromise = this.resolveFolderId();
    }
    return this.folderIdPromise;
  }

  private async resolveFolderId(): Promise<string> {
    const drive = this.getClient();
    const existing = await drive.files.list({
      q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });
    if (existing.data.files && existing.data.files.length > 0) {
      return existing.data.files[0].id!;
    }
    const created = await drive.files.create({
      requestBody: { name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" },
      fields: "id",
    });
    return created.data.id!;
  }

  private async findFileId(filename: string): Promise<string | null> {
    const drive = this.getClient();
    const folderId = await this.getFolderId();
    const res = await drive.files.list({
      q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
    });
    return res.data.files && res.data.files.length > 0 ? res.data.files[0].id! : null;
  }

  protected async readFile<T>(filename: string): Promise<T[]> {
    const drive = this.getClient();
    const fileId = await this.findFileId(filename);
    if (!fileId) return [];
    const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "json" });
    return (res.data as T[]) ?? [];
  }

  protected async writeFile<T>(filename: string, data: T[]): Promise<void> {
    const drive = this.getClient();
    const fileId = await this.findFileId(filename);
    const folderId = await this.getFolderId();
    const media = { mimeType: "application/json", body: JSON.stringify(data, null, 2) };
    if (fileId) {
      await drive.files.update({ fileId, media });
    } else {
      await drive.files.create({
        requestBody: { name: filename, parents: [folderId] },
        media,
        fields: "id",
      });
    }
  }
}
