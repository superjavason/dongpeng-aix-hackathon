import { prisma } from "@/lib/db";
import { averageScore } from "@/lib/scoring";

export type RankedSubmission = {
  submissionId: string;
  projectId: string;
  title: string;
  projectTitle: string;
  track: string;
  average: number | null;
  scoreCount: number;
  rank: number;
  memberNames: string[];
};

/** 计算某赛事下所有作品的均分排名（按均分降序，null 排末尾）。 */
export async function getRankedSubmissions(
  eventId: string
): Promise<RankedSubmission[]> {
  const submissions = await prisma.submission.findMany({
    where: { project: { eventId } },
    include: {
      scores: { select: { total: true } },
      project: {
        select: {
          id: true,
          title: true,
          track: true,
          memberships: {
            where: { status: "approved" },
            select: { user: { select: { name: true } } },
          },
        },
      },
    },
  });

  const rows = submissions.map((s) => ({
    submissionId: s.id,
    projectId: s.project.id,
    title: s.title,
    projectTitle: s.project.title,
    track: s.project.track,
    average: averageScore(s.scores.map((x) => x.total)),
    scoreCount: s.scores.length,
    memberNames: s.project.memberships.map((m) => m.user.name),
  }));

  rows.sort((a, b) => {
    if (a.average === null && b.average === null) return 0;
    if (a.average === null) return 1;
    if (b.average === null) return -1;
    return b.average - a.average;
  });

  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
