import { StorageProvider } from "./StorageProvider";
import { GoogleDriveProvider } from "./GoogleDriveProvider";
import { LocalFileProvider } from "./LocalFileProvider";

export type { StorageProvider } from "./StorageProvider";

let instance: StorageProvider | null = null;
let initPromise: Promise<void> | null = null;

/**
 * 앱 전체에서 사용할 StorageProvider의 단일 진입점.
 *
 * 다른 클라우드로 확장하려면:
 *   1) lib/storage/XxxProvider.ts에서 JsonBackedProvider를 상속(또는
 *      StorageProvider를 직접 구현)
 *   2) 아래 switch문에 분기 추가
 *   3) STORAGE_PROVIDER 환경변수 값만 바꾸면 나머지 코드는 수정 불필요
 */
function createProvider(): StorageProvider {
  const kind = process.env.STORAGE_PROVIDER ?? "local";
  switch (kind) {
    case "google-drive":
      return new GoogleDriveProvider();
    case "local":
      return new LocalFileProvider();
    default:
      throw new Error(`알 수 없는 STORAGE_PROVIDER: ${kind}`);
  }
}

export async function getStorage(): Promise<StorageProvider> {
  if (!instance) {
    instance = createProvider();
    initPromise = instance.init();
  }
  await initPromise;
  return instance;
}
