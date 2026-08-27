import { Meeting, Person, Place, StoryCategory, SearchQuery, MeetingSearchResult } from "@/lib/types";

/**
 * 스토리지 추상화 인터페이스.
 *
 * 앱의 나머지 코드(페이지, API 라우트)는 이 인터페이스에만 의존하고,
 * 실제 데이터가 어디에 저장되는지는 알지 못합니다.
 *
 * 현재는 GoogleDriveProvider가 유일한 구현체지만, 동일한 인터페이스를
 * 구현하는 클래스를 추가하는 것만으로 다른 클라우드(Notion, Dropbox,
 * 자체 서버 DB 등)로 확장할 수 있습니다. (V컬러링 프로젝트의
 * StorageProvider 패턴과 동일한 접근입니다.)
 */
export interface StorageProvider {
  // --- 초기화 ---
  /** 이 provider가 사용할 저장 공간이 준비되어 있는지 확인하고, 없으면 생성 */
  init(): Promise<void>;

  // --- Person (참석자) ---
  listPeople(): Promise<Person[]>;
  getPerson(id: string): Promise<Person | null>;
  upsertPerson(person: Person): Promise<Person>;
  deletePerson(id: string): Promise<void>;

  // --- Place (장소) ---
  listPlaces(): Promise<Place[]>;
  getPlace(id: string): Promise<Place | null>;
  upsertPlace(place: Place): Promise<Place>;
  deletePlace(id: string): Promise<void>;

  // --- StoryCategory (해시태그 카테고리) ---
  listCategories(): Promise<StoryCategory[]>;
  upsertCategory(category: StoryCategory): Promise<StoryCategory>;
  deleteCategory(id: string): Promise<void>;

  // --- Meeting (모임 기록) ---
  listMeetings(): Promise<Meeting[]>;
  getMeeting(id: string): Promise<Meeting | null>;
  upsertMeeting(meeting: Meeting): Promise<Meeting>;
  deleteMeeting(id: string): Promise<void>;

  // --- 검색 ---
  /** 기본 구현은 listMeetings() 후 메모리에서 필터링해도 되고,
   *  provider가 원한다면 자체 인덱스로 최적화해도 됨 */
  search(query: SearchQuery): Promise<MeetingSearchResult[]>;
}
