import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CRITERIA, TRACKS } from "../lib/constants";

const prisma = new PrismaClient();

const PASSWORD = "password123";

async function main() {
  console.log("🌱 开始播种数据…");

  // 清空（按依赖顺序）
  await prisma.score.deleteMany();
  await prisma.judgeAssignment.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.project.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(PASSWORD, 10);

  // 用户
  const admin = await prisma.user.create({
    data: {
      name: "平台管理员",
      email: "admin@dongpeng.com",
      passwordHash: hash,
      role: "admin",
      bio: "东鹏 AI+X 黑客松组委会",
    },
  });

  const judges = await Promise.all(
    [
      { name: "李博士", email: "judge1@dongpeng.com", bio: "AI 算法专家" },
      { name: "王总监", email: "judge2@dongpeng.com", bio: "产品与商业化负责人" },
      { name: "陈工", email: "judge3@dongpeng.com", bio: "资深架构师" },
    ].map((j) =>
      prisma.user.create({
        data: { ...j, passwordHash: hash, role: "judge" },
      })
    )
  );

  const participants = await Promise.all(
    [
      "张三",
      "李四",
      "王五",
      "赵六",
      "钱七",
      "孙八",
      "周九",
      "吴十",
    ].map((name, i) =>
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

  // 赛事（当前活跃，处于报名组队中阶段）
  const now = new Date();
  const event = await prisma.event.create({
    data: {
      name: "东鹏 AI+X 黑客松 2026",
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

  // 项目 1：发起人 张三，已组队
  const p1 = await prisma.project.create({
    data: {
      eventId: event.id,
      ownerId: participants[0].id,
      title: "智能瓷砖排版助手",
      tagline: "用 AI 一键生成最优瓷砖铺贴方案",
      description:
        "面向门店导购与设计师，输入空间尺寸与风格偏好，AI 自动生成多套铺贴排版与用量清单，降低损耗、提升成单率。",
      track: TRACKS[0],
      maxMembers: 4,
    },
  });
  await prisma.membership.create({
    data: {
      projectId: p1.id,
      userId: participants[0].id,
      status: "approved",
      teamRole: "owner",
    },
  });
  await prisma.membership.createMany({
    data: [
      { projectId: p1.id, userId: participants[1].id, status: "approved" },
      {
        projectId: p1.id,
        userId: participants[2].id,
        status: "pending",
        message: "我擅长前端与三维可视化，想加入！",
      },
    ],
  });

  // 项目 2：发起人 赵六，招募中
  const p2 = await prisma.project.create({
    data: {
      eventId: event.id,
      ownerId: participants[3].id,
      title: "导购话术 AI 教练",
      tagline: "实时分析对话，给出最佳销售建议",
      description:
        "结合门店知识库与大模型，为一线导购提供实时话术建议与产品推荐，沉淀优秀案例，缩短新人成长周期。",
      track: TRACKS[1],
      maxMembers: 3,
    },
  });
  await prisma.membership.create({
    data: {
      projectId: p2.id,
      userId: participants[3].id,
      status: "approved",
      teamRole: "owner",
    },
  });
  await prisma.membership.create({
    data: {
      projectId: p2.id,
      userId: participants[4].id,
      status: "pending",
      message: "想负责数据与后端。",
    },
  });

  // 项目 3：发起人 周九
  const p3 = await prisma.project.create({
    data: {
      eventId: event.id,
      ownerId: participants[6].id,
      title: "AI 空间风格生成器",
      tagline: "拍一张照，生成整屋装修效果",
      description:
        "上传毛坯或现状照片，AI 输出多种风格的整屋效果图，并关联东鹏产品 SKU，打通灵感到下单的链路。",
      track: TRACKS[2],
      maxMembers: 5,
    },
  });
  await prisma.membership.create({
    data: {
      projectId: p3.id,
      userId: participants[6].id,
      status: "approved",
      teamRole: "owner",
    },
  });

  console.log("✅ 播种完成");
  console.log("\n演示账号（密码均为 password123）：");
  console.log(`  管理员: ${admin.email}`);
  console.log(`  评委:   ${judges.map((j) => j.email).join(", ")}`);
  console.log(`  参赛者: user1@dongpeng.com … user8@dongpeng.com`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
