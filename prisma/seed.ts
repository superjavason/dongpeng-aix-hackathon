import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CRITERIA, TRACKS } from "../lib/constants";
import { computeTotal } from "../lib/scoring";

const prisma = new PrismaClient();
const PASSWORD = "password123";

async function main() {
  console.log("🌱 开始播种数据…");

  await prisma.projectLike.deleteMany();
  await prisma.score.deleteMany();
  await prisma.judgeAssignment.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.project.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      name: "平台管理员",
      email: "admin@dongpeng.com",
      passwordHash: hash,
      role: "admin",
      bio: "AI+X黑客松大赛组委会",
    },
  });

  const judges = await Promise.all(
    [
      { name: "李博士", email: "judge1@dongpeng.com", bio: "AI 算法专家" },
      { name: "王总监", email: "judge2@dongpeng.com", bio: "产品与商业化负责人" },
      { name: "陈工", email: "judge3@dongpeng.com", bio: "资深架构师" },
    ].map((j) =>
      prisma.user.create({ data: { ...j, passwordHash: hash, role: "judge" } })
    )
  );

  const names = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十", "郑十一", "冯十二"];
  const users = await Promise.all(
    names.map((name, i) =>
      prisma.user.create({
        data: {
          name,
          email: `user${i + 1}@dongpeng.com`,
          passwordHash: hash,
          role: "participant",
        },
      })
    )
  );

  const now = new Date();
  const event = await prisma.event.create({
    data: {
      name: "AI+X黑客松大赛 2026",
      description:
        "以「AI + X」为主题，鼓励员工与生态伙伴用人工智能重塑制造、营销、设计、办公与体验。科技·艺术·生活，让创新落地。",
      track: "AI+X",
      phase: "registration",
      isActive: true,
      startAt: now,
      endAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14),
      scoreCriteria: DEFAULT_CRITERIA,
      resultsPublished: false,
    },
  });

  // 项目定义：owner 索引、approved 成员索引、pending 成员索引、是否有作品
  const defs = [
    {
      title: "智能瓷砖排版助手",
      tagline: "用 AI 一键生成最优瓷砖铺贴方案",
      description:
        "面向门店导购与设计师，输入空间尺寸与风格偏好，AI 自动生成多套铺贴排版与用量清单，降低损耗、提升成单率。",
      track: TRACKS[1],
      owner: 0,
      approved: [1],
      pending: [2],
      sub: {
        title: "智能瓷砖排版助手 v1",
        summary: "已完成排版算法与门店小程序原型，损耗率平均降低 12%，导购可一键出方案并生成用量清单。",
        repoUrl: "https://github.com/dongpeng/tile-layout",
        demoUrl: "https://demo.dongpeng.com/tile",
      },
    },
    {
      title: "导购话术 AI 教练",
      tagline: "实时分析对话，给出最佳销售建议",
      description:
        "结合门店知识库与大模型，为一线导购提供实时话术建议与产品推荐，沉淀优秀案例，缩短新人成长周期。",
      track: TRACKS[1],
      owner: 3,
      approved: [4],
      pending: [5],
      sub: {
        title: "导购话术 AI 教练",
        summary: "实现实时语音转写 + 话术建议，接入门店知识库；试点门店成单率提升 8%。",
        repoUrl: "https://github.com/dongpeng/sales-coach",
      },
    },
    {
      title: "AI 空间风格生成器",
      tagline: "拍一张照，生成整屋装修效果",
      description:
        "上传毛坯或现状照片，AI 输出多种风格的整屋效果图，并关联东鹏产品 SKU，打通灵感到下单的链路。",
      track: TRACKS[3],
      owner: 6,
      approved: [7, 8],
      pending: [],
      sub: {
        title: "AI 空间风格生成器",
        summary: "基于扩散模型的整屋风格迁移，支持 6 种风格，自动匹配东鹏 SKU 并生成购物清单。",
        demoUrl: "https://demo.dongpeng.com/space",
        videoUrl: "https://demo.dongpeng.com/space/video",
      },
    },
    {
      title: "工厂能耗智能优化",
      tagline: "AI 预测调度，节能降碳",
      description:
        "采集窑炉与产线能耗数据，用时序模型预测并优化调度策略，目标降低单位产品能耗。",
      track: TRACKS[2],
      owner: 9,
      approved: [0],
      pending: [],
      sub: {
        title: "工厂能耗智能优化平台",
        summary: "时序预测 + 调度优化，模拟环境下窑炉能耗下降 9.5%，已对接 IoT 数据看板。",
        repoUrl: "https://github.com/dongpeng/energy-ai",
      },
    },
    {
      title: "AI 客服知识中枢",
      tagline: "让售后问题秒级响应",
      description:
        "构建统一的产品知识库与检索增强问答，覆盖安装、保养、售后场景，降低人工客服压力。",
      track: TRACKS[1],
      owner: 1,
      approved: [],
      pending: [3],
      sub: null,
    },
  ];

  const criteria = DEFAULT_CRITERIA;
  const submissionsForScore: { id: string }[] = [];
  // 记录项目及其「参与者」用户 id（发起人 + 已通过成员），用于播种人气点赞时避开本人项目
  const createdProjects: { id: string; participantIds: Set<string> }[] = [];

  for (const d of defs) {
    const project = await prisma.project.create({
      data: {
        eventId: event.id,
        ownerId: users[d.owner].id,
        title: d.title,
        tagline: d.tagline,
        description: d.description,
        track: d.track,
        maxMembers: 4,
        memberships: {
          create: [
            { userId: users[d.owner].id, status: "approved", teamRole: "owner" },
            ...d.approved.map((i) => ({
              userId: users[i].id,
              status: "approved" as const,
              teamRole: "member" as const,
            })),
            ...d.pending.map((i) => ({
              userId: users[i].id,
              status: "pending" as const,
              teamRole: "member" as const,
              message: "我想加入贡献力量！",
            })),
          ],
        },
      },
    });

    if (d.sub) {
      const submission = await prisma.submission.create({
        data: {
          projectId: project.id,
          title: d.sub.title,
          summary: d.sub.summary,
          repoUrl: d.sub.repoUrl ?? null,
          demoUrl: d.sub.demoUrl ?? null,
          videoUrl: d.sub.videoUrl ?? null,
          images: [],
          attachments: [],
        },
      });
      submissionsForScore.push(submission);
    }

    createdProjects.push({
      id: project.id,
      participantIds: new Set([
        users[d.owner].id,
        ...d.approved.map((i) => users[i].id),
      ]),
    });
  }

  // 预置人气点赞：每位参赛者为若干个「非本人参与」的项目点赞（额度上限内），演示人气榜
  for (let u = 0; u < users.length; u++) {
    const voter = users[u];
    const likable = createdProjects.filter(
      (p) => !p.participantIds.has(voter.id)
    );
    // 借用用户序号做确定性数量，避免随机导致每次 seed 结果不一致
    const takeCount = Math.min(likable.length, (u % 3) + 2);
    const targets = likable.slice(0, takeCount);
    if (targets.length > 0) {
      await prisma.projectLike.createMany({
        data: targets.map((p) => ({
          eventId: event.id,
          projectId: p.id,
          userId: voter.id,
        })),
      });
    }
  }

  // 预置部分评分（演示评审进度与排行榜数据，phase 切到 evaluating/ended 即可见）
  const scoreSets = [
    { business_value: 92, solution_quality: 88, implementation_result: 85, promotion_potential: 90 },
    { business_value: 85, solution_quality: 90, implementation_result: 80, promotion_potential: 86 },
    { business_value: 95, solution_quality: 92, implementation_result: 90, promotion_potential: 93 },
    { business_value: 80, solution_quality: 85, implementation_result: 78, promotion_potential: 82 },
  ];
  // judge1 评前 3 个作品，judge2 评前 2 个作品
  for (let i = 0; i < submissionsForScore.length; i++) {
    const sub = submissionsForScore[i];
    if (i < 3) {
      const s = scoreSets[i % scoreSets.length];
      await prisma.score.create({
        data: {
          submissionId: sub.id,
          judgeId: judges[0].id,
          scores: s,
          total: computeTotal(s, criteria),
          comment: "整体完成度高，落地价值明显。",
        },
      });
    }
    if (i < 2) {
      const s = scoreSets[(i + 1) % scoreSets.length];
      await prisma.score.create({
        data: {
          submissionId: sub.id,
          judgeId: judges[1].id,
          scores: s,
          total: computeTotal(s, criteria),
          comment: "商业价值突出，建议补充技术细节。",
        },
      });
    }
  }

  console.log("✅ 播种完成");
  console.log("\n演示账号（密码均为 password123）：");
  console.log(`  管理员: ${admin.email}`);
  console.log(`  评委:   ${judges.map((j) => j.email).join(", ")}`);
  console.log(`  参赛者: user1@dongpeng.com … user10@dongpeng.com`);
  console.log(
    `\n赛事当前阶段：报名组队中（registration）。在「管理员后台 → 赛事设置」可切换阶段以演示作品提交 / 评委打分 / 排行榜。`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
