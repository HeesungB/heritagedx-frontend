import type { ServerRepositories } from "../interfaces";
import { ClubServerRepository } from "../repositories/server/club.server-repository.impl";

interface ServerRepoConfig {
  baseUrl: string;
  revalidate: number;
}

export function createServerRepositories(
  config: ServerRepoConfig,
): ServerRepositories {
  return {
    clubs: new ClubServerRepository(config),
  };
}
