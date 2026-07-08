import { prisma } from "@/lib/db";

export type LikeState = {
  /** 该项目总得票数 */
  likeCount: number;
  /** 当前用户是否已点赞该项目 */
  liked: boolean;
  /** 当前用户在该赛事的剩余点赞额度 */
  remaining: number;
  /** 每用户每赛事的点赞上限 */
  max: number;
};

/**
 * 读取某项目在当前用户视角下的点赞状态。
 * user 为 null（未登录）时 liked=false、remaining=max。
 */
export async function getLikeState(
  eventId: string,
  projectId: string,
  userId: string | null | undefined,
  maxLikesPerUser: number
): Promise<LikeState> {
  const [likeCount, liked, used] = await Promise.all([
    prisma.projectLike.count({ where: { projectId } }),
    userId
      ? prisma.projectLike
          .findUnique({ where: { userId_projectId: { userId, projectId } } })
          .then((r) => !!r)
      : Promise.resolve(false),
    userId
      ? prisma.projectLike.count({ where: { eventId, userId } })
      : Promise.resolve(0),
  ]);

  return {
    likeCount,
    liked,
    remaining: remainingBudget(maxLikesPerUser, used),
    max: maxLikesPerUser,
  };
}

export type PopularProject = {
  projectId: string;
  title: string;
  tagline: string;
  track: string;
  ownerName: string;
  likeCount: number;
  rank: number;
};

export type RankablePopular = Omit<PopularProject, "rank"> & {
  createdAt: Date;
};

/** 剩余点赞额度（不为负）。 */
export function remainingBudget(max: number, used: number): number {
  return Math.max(0, max - used);
}

/**
 * 纯函数：按票数降序、票数相同按创建时间升序排名，过滤掉 0 票项目。
 * 与 IO 解耦，便于单测。
 */
export function rankPopular(projects: RankablePopular[]): PopularProject[] {
  return projects
    .filter((p) => p.likeCount > 0)
    .sort((a, b) => {
      if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map(({ createdAt: _createdAt, ...r }, i) => ({ ...r, rank: i + 1 }));
}

/** 某赛事下项目的人气排名：按票数降序，票数相同按创建时间升序。仅返回票数 > 0 的项目。 */
export async function getPopularityRanking(
  eventId: string
): Promise<PopularProject[]> {
  const projects = await prisma.project.findMany({
    where: { eventId },
    select: {
      id: true,
      title: true,
      tagline: true,
      track: true,
      createdAt: true,
      owner: { select: { name: true } },
      _count: { select: { likes: true } },
    },
  });

  return rankPopular(
    projects.map((p) => ({
      projectId: p.id,
      title: p.title,
      tagline: p.tagline,
      track: p.track,
      ownerName: p.owner.name,
      likeCount: p._count.likes,
      createdAt: p.createdAt,
    }))
  );
}
