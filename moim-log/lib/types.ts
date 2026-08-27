// 모임 기록 앱의 핵심 데이터 모델
// 저장 방식(구글 드라이브 등)에 관계없이 동일하게 사용되는 도메인 타입입니다.

export type ID = string;

/** 해시태그 카테고리 (#나이, #커리어 등). 기본 제공 + 사용자가 직접 추가한 커스텀 카테고리 */
export interface StoryCategory {
  id: ID;
  label: string; // "나이", "커리어" 등 (# 없이 저장, 표시할 때 # 붙임)
  isDefault: boolean;
  createdAt: string; // ISO datetime
}

/** 참석자 마스터 데이터 - 한 번 등록하면 이후 모임에서 드랍다운으로 재사용 */
export interface Person {
  id: ID;
  name: string;
  age?: string;
  education?: string;
  family?: string;
  career?: string;
  companyTitle?: string;
  network?: string;
  hobby?: string;
  etc?: string;
  createdAt: string;
  updatedAt: string;
}

/** 장소에 속한 메뉴 (가격 포함) */
export interface Menu {
  id: ID;
  name: string;
  price?: number;
}

/** 장소 마스터 데이터 - 재사용 가능, 향후 공유 대상 */
export interface Place {
  id: ID;
  name: string;
  address?: string;
  menus: Menu[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 참석자별로 나눈 이야기 한 건.
 * 모임 당일 작성될 수도, 이후 시점에 추가될 수도 있음 (createdAt으로 구분).
 * content 안에는 #카테고리 형태의 해시태그가 자유롭게 섞여 들어갈 수 있음.
 */
export interface StoryEntry {
  id: ID;
  personId: ID;
  content: string;
  categoryIds: ID[]; // content에 실제 사용된 카테고리 (검색/필터용 인덱스)
  createdAt: string; // 작성일시 - "추가 일자"
}

/** 모임 기록 - 최상위 엔티티 */
export interface Meeting {
  id: ID;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  placeId: ID;
  attendeeIds: ID[];
  amount?: number;
  stories: StoryEntry[];
  createdAt: string;
  updatedAt: string;
}

/** 검색 결과 - 모임 + 관련 참석자/장소 정보를 함께 담아 화면에 바로 표시 가능한 형태 */
export interface MeetingSearchResult extends Meeting {
  place: Place;
  attendees: Person[];
}

export type SearchQuery = {
  q?: string; // 이름/장소/메뉴 등 통합 검색어
  personId?: ID;
  placeId?: ID;
  categoryId?: ID;
  dateFrom?: string;
  dateTo?: string;
};
