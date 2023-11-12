
import { Status } from "https://deno.land/std/http/http_status.ts";
import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";

export function getAtDate(db: Database, date: string) {
  const visitStmt = db.prepare(`
    select entity,
      abs(julianday(json_extract(entity, '$.starts_at')) - julianday(:date)) as start_diff,
      abs(julianday(json_extract(entity, '$.ends_at')) - julianday(:date)) as end_diff,
      julianday(:date) between julianday(json_extract(entity, '$.starts_at')) and julianday(json_extract(entity, '$.ends_at')) AS is_within_range
    FROM entity_visits
    ORDER BY
      is_within_range DESC,
      CASE
        WHEN start_diff < end_diff THEN start_diff
        ELSE end_diff
      END
    LIMIT 1;
    `
    );

  const {entity, start_diff, end_diff, is_within_range} = visitStmt.get({
    date
  });
  visitStmt.finalize();

  const parsedEntity = JSON.parse(entity);

  const placeStmt = db.prepare(`
  select entity from entity_places
    where json_extract(entity, '$.id') = :id
  `);
  const {entity: place} = placeStmt.get({
    id: parsedEntity.place
  });
  placeStmt.finalize();

  const { address } = JSON.parse(place);

  return {
    location: {
      address,
      latitude: parsedEntity.latitude,
      longitude: parsedEntity.longitude,
    },
    time: {
      startsAt: new Date(parsedEntity.starts_at),
      startOffset: start_diff,
      endsAt: new Date(parsedEntity.ends_at),
      endOffset: end_diff,
      withinRange: is_within_range === 1,
    }
  }
}

type AtDateConfig = {  }
type AtDateServices = { db: Database }

export function atDate(config: AtDateConfig, services: AtDateServices) {
  const { db }  = services;

  return async function (ctx: any) {
    const date = ctx.request.url.searchParams.get('date');

    const info = getAtDate(db, date);

    ctx.response.status = Status.OK;
    ctx.response.body = JSON.stringify(info);
  }
}
