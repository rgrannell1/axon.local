
import { Database } from "https://deno.land/x/sqlite3@0.9.1/mod.ts";

const tables = {
  entity: `
 create table if not exists entity as
   with id_rel as (
     select src, rel, json_group_array(distinct tgt) as tgt
     from content
     group by src, rel)

   select distinct
     json_group_object(
       rel,
       case when json_type(tgt) == 'array' and json_array_length(tgt) == 1
           then json(tgt)->0
           else json(tgt)
       end) as entity
   from id_rel
   group by src
   order by src;
  `,
  entity_visits: `
  create table if not exists entity_visits as
    select entity from entity where 'GoogleTakeout/Visit' in (
      select value from json_each( entity, '$.is' ));
  `,
  entity_places: `
  create table if not exists entity_places as
    select entity from entity where 'GoogleTakeout/Place' in (
      select value from json_each( entity, '$.is' ));
  `
}

export class CoppermindDatabase {
  static client(path: string) {
    return new Database(path, {
      unsafeConcurrency: true,
    });
  }

  static dropTables(db: Database) {
    for (const table of Object.keys(tables)) {
      db.run(`drop table if exists ${table}`);
    }
  }

  static recreateTables(db: Database) {
    for (const [table, defn] of Object.entries(tables)) {
      db.run(defn);
    }
  }
}
