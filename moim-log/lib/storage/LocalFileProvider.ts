import { promises as fs } from "fs";
import path from "path";
import { JsonBackedProvider } from "./JsonBackedProvider";

const DATA_DIR = path.join(process.cwd(), ".local-data");

/**
 * 로컬 디스크에 저장하는 provider. 구글 드라이브 연동 없이
 * `npm run dev`로 바로 화면/기능을 테스트하고 싶을 때 사용합니다.
 * STORAGE_PROVIDER=local 로 설정하면 활성화됩니다.
 */
export class LocalFileProvider extends JsonBackedProvider {
  protected async readFile<T>(filename: string): Promise<T[]> {
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  protected async writeFile<T>(filename: string, data: T[]): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), "utf-8");
  }
}
