import { StorageProvider } from "./StorageProvider";
import { Meeting, Person, Place, StoryCategory, SearchQuery, MeetingSearchResult } from "@/lib/types";
import { searchMeetingsInMemory } from "./searchHelper";

const FILES = {
  people: "people.json",
  places: "places.json",
  categories: "categories.json",
  meetings: "meetings.json",
} as const;

export const DEFAULT_CATEGORIES: Omit<StoryCategory, "id" | "createdAt">[] = [
  { label: "나이", isDefault: true },
  { label: "학력", isDefault: true },
  { label: "가족관계", isDefault: true },
  { label: "커리어", isDefault: true },
  { label: "회사및직함", isDefault: true },
  { label: "주요Network", isDefault: true },
  { label: "취미", isDefault: true },
  { label: "기타", isDefault: true },
];

/**
 * 모든 엔티티를 JSON 파일 하나씩(people.json, places.json, ...)으로 저장하는
 * 공통 로직. 실제 파일을 "어디서" 읽고 쓰는지만 하위 클래스가 결정하면 됨.
 *
 * - GoogleDriveProvider: 구글 드라이브의 전용 폴더에 파일로 저장
 * - LocalFileProvider: 로컬 디스크에 저장 (개발/테스트용)
 *
 * 데이터 규모가 커지면(수천 건 이상) 하위 클래스에서 개별 메서드를
 * 오버라이드해 페이지네이션/인덱싱을 붙이면 됨.
 */
export abstract class JsonBackedProvider implements StorageProvider {
  protected abstract readFile<T>(filename: string): Promise<T[]>;
  protected abstract writeFile<T>(filename: string, data: T[]): Promise<void>;

  async init(): Promise<void> {
    const categories = await this.readFile<StoryCategory>(FILES.categories);
    if (categories.length === 0) {
      const now = new Date().toISOString();
      const seeded = DEFAULT_CATEGORIES.map((c, i) => ({
        ...c,
        id: `cat_default_${i}`,
        createdAt: now,
      }));
      await this.writeFile(FILES.categories, seeded);
    }
  }

  // --- Person ---
  listPeople() {
    return this.readFile<Person>(FILES.people);
  }
  async getPerson(id: string) {
    const all = await this.listPeople();
    return all.find((p) => p.id === id) ?? null;
  }
  async upsertPerson(person: Person) {
    const all = await this.listPeople();
    const idx = all.findIndex((p) => p.id === person.id);
    if (idx >= 0) all[idx] = person;
    else all.push(person);
    await this.writeFile(FILES.people, all);
    return person;
  }
  async deletePerson(id: string) {
    const all = await this.listPeople();
    await this.writeFile(
      FILES.people,
      all.filter((p) => p.id !== id)
    );
  }

  // --- Place ---
  listPlaces() {
    return this.readFile<Place>(FILES.places);
  }
  async getPlace(id: string) {
    const all = await this.listPlaces();
    return all.find((p) => p.id === id) ?? null;
  }
  async upsertPlace(place: Place) {
    const all = await this.listPlaces();
    const idx = all.findIndex((p) => p.id === place.id);
    if (idx >= 0) all[idx] = place;
    else all.push(place);
    await this.writeFile(FILES.places, all);
    return place;
  }
  async deletePlace(id: string) {
    const all = await this.listPlaces();
    await this.writeFile(
      FILES.places,
      all.filter((p) => p.id !== id)
    );
  }

  // --- StoryCategory ---
  listCategories() {
    return this.readFile<StoryCategory>(FILES.categories);
  }
  async upsertCategory(category: StoryCategory) {
    const all = await this.listCategories();
    const idx = all.findIndex((c) => c.id === category.id);
    if (idx >= 0) all[idx] = category;
    else all.push(category);
    await this.writeFile(FILES.categories, all);
    return category;
  }
  async deleteCategory(id: string) {
    const all = await this.listCategories();
    await this.writeFile(
      FILES.categories,
      all.filter((c) => c.id !== id)
    );
  }

  // --- Meeting ---
  listMeetings() {
    return this.readFile<Meeting>(FILES.meetings);
  }
  async getMeeting(id: string) {
    const all = await this.listMeetings();
    return all.find((m) => m.id === id) ?? null;
  }
  async upsertMeeting(meeting: Meeting) {
    const all = await this.listMeetings();
    const idx = all.findIndex((m) => m.id === meeting.id);
    if (idx >= 0) all[idx] = meeting;
    else all.push(meeting);
    await this.writeFile(FILES.meetings, all);
    return meeting;
  }
  async deleteMeeting(id: string) {
    const all = await this.listMeetings();
    await this.writeFile(
      FILES.meetings,
      all.filter((m) => m.id !== id)
    );
  }

  // --- 검색 ---
  async search(query: SearchQuery): Promise<MeetingSearchResult[]> {
    const [meetings, people, places] = await Promise.all([
      this.listMeetings(),
      this.listPeople(),
      this.listPlaces(),
    ]);
    return searchMeetingsInMemory(meetings, people, places, query);
  }
}
