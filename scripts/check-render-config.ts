import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import yaml from "js-yaml";

type FromDatabase = { name: string; property: string };
type EnvVar = {
  key: string;
  fromDatabase?: FromDatabase;
  value?: string;
  generateValue?: boolean;
};
type Service = {
  type: string;
  name: string;
  region?: string;
  envVars?: EnvVar[];
};
type Database = { name: string; region?: string };
type RenderConfig = { databases?: Database[]; services?: Service[] };

const file = resolve(process.cwd(), "render.yaml");
const config = yaml.load(readFileSync(file, "utf8")) as RenderConfig;

const dbRegions = new Map<string, string | undefined>();
for (const db of config.databases ?? []) {
  dbRegions.set(db.name, db.region);
}

const refs: { service: Service; dbName: string }[] = [];
for (const svc of config.services ?? []) {
  for (const env of svc.envVars ?? []) {
    if (env.fromDatabase) {
      refs.push({ service: svc, dbName: env.fromDatabase.name });
    }
  }
}

const byDb = new Map<string, Service[]>();
for (const { service, dbName } of refs) {
  if (!byDb.has(dbName)) byDb.set(dbName, []);
  byDb.get(dbName)!.push(service);
}

const errors: string[] = [];

for (const [dbName, services] of byDb) {
  if (!dbRegions.has(dbName)) {
    errors.push(`Service references unknown database "${dbName}"`);
    continue;
  }
  const dbRegion = dbRegions.get(dbName);
  const regions = new Set(
    services.map((s) => s.region).filter((r): r is string => Boolean(r)),
  );
  if (dbRegion) regions.add(dbRegion);
  if (regions.size > 1) {
    const detail = services
      .map((s) => `${s.name}=${s.region ?? "(unspecified)"}`)
      .join(", ");
    errors.push(
      `Database "${dbName}" (region: ${dbRegion ?? "(unspecified)"}) is referenced by services in different regions: ${detail}. ` +
        `Render's internal Postgres hostname (dpg-*-a) only resolves within the database's region — cross-region access fails with ENOTFOUND at runtime.`,
    );
  }
}

if (errors.length > 0) {
  console.error("render.yaml region check failed:");
  for (const e of errors) console.error("  -", e);
  process.exit(1);
}

console.log("render.yaml region check OK");
