import { Meeting, Person, Place, SearchQuery, MeetingSearchResult, StoryEntry } from "@/lib/types";

/**
 * provider 구현체가 공통으로 재사용할 수 있는 인메모리 검색.
 * 데이터 규모가 커지면 provider별로 자체 인덱스를 붙여 오버라이드해도 됨.
 */
export function searchMeetingsInMemory(
  meetings: Meeting[],
  people: Person[],
  places: Place[],
  query: SearchQuery
): MeetingSearchResult[] {
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const placesById = new Map(places.map((p) => [p.id, p]));

  const q = query.q?.trim().toLowerCase();

  const matches = meetings.filter((m) => {
    const place = placesById.get(m.placeId);
    const attendees = m.attendeeIds.map((id) => peopleById.get(id)).filter(Boolean) as Person[];

    if (query.personId && !m.attendeeIds.includes(query.personId)) return false;
    if (query.placeId && m.placeId !== query.placeId) return false;
    if (query.dateFrom && m.date < query.dateFrom) return false;
    if (query.dateTo && m.date > query.dateTo) return false;
    if (query.categoryId) {
      const hasCategory = m.stories.some((s: StoryEntry) => s.categoryIds.includes(query.categoryId!));
      if (!hasCategory) return false;
    }

    if (q) {
      const haystack = [
        m.date,
        place?.name,
        place?.address,
        ...(place?.menus.map((menu) => menu.name) ?? []),
        ...attendees.map((a) => a.name),
        ...m.stories.map((s) => s.content),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  return matches
    .map((m) => ({
      ...m,
      place: placesById.get(m.placeId)!,
      attendees: m.attendeeIds.map((id) => peopleById.get(id)).filter(Boolean) as Person[],
    }))
    .filter((m) => m.place)
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // 최신 모임 일자순
}
