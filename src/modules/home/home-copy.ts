export const HOME_CHAPTER_COPY = {
  knowledge: {
    depth: "80m",
    label: "知识潮汐",
    title: "知识不是孤岛，它在分享中形成洋流。",
    description:
      "从嵌入式系统到信号处理，从基础工具到项目复盘，每一篇记录都成为后来者可以辨认的光点。",
  },
  competition: {
    depth: "300m",
    label: "竞赛航线",
    title: "把未知拆成问题，把问题变成可以抵达的坐标。",
    description: "声纳捕获竞赛方向，星座航图记录经验、资料与成果。",
  },
  archive: {
    depth: "900m",
    label: "时间回声",
    title: "每一次发生，都在深处留下回声。",
    description: "新闻收进科协档案夹，大事记沿着回声由远及近，标出科协一路抵达的坐标。",
  },
  routine: {
    depth: "1800m",
    label: "同行灯火",
    title: "越向深处，同行的灯光越显得珍贵。",
    description: "实验室里的夜晚、比赛途中的照片和随手留下的话，拼成技术之外真实的科协。",
  },
  honors: {
    depth: "4000m",
    label: "海底星图",
    title: "星光沉入海底，成为我们共同抵达过的坐标。",
    description: "让知识被分享，让热爱被看见，让每一次实践都成为抵达未知的航线。",
  },
} as const;

export type HomeChapterKey = keyof typeof HOME_CHAPTER_COPY;
